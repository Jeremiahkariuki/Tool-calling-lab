import type { ToolDefinition } from './openapiParser';
import type { ProviderSetting } from './apiKeys';
import { executeToolWebhook } from './webhookTester';

export interface LiveToolCall {
  id: string;
  name: string;
  arguments: any;
}

export interface LiveRunStep {
  stepIndex: number;
  title: string;
  stage: 'user_prompt' | 'llm_call' | 'tool_call' | 'tool_execution' | 'tool_response' | 'final_response';
  description: string;
  requestPayload?: any;
  responsePayload?: any;
  status?: number;
  latencyMs?: number;
  timestamp: string;
}

export interface LiveRunResult {
  provider: string;
  model: string;
  success: boolean;
  latencyMs: number;
  toolCallsCount: number;
  toolCalls: LiveToolCall[];
  finalText: string;
  steps: LiveRunStep[];
  error?: string;
}

const nowTime = () => new Date().toLocaleTimeString();

/**
 * Execute real API call with tool calling support across OpenAI, Anthropic, Gemini, DeepSeek, Ollama, and Local servers.
 */
export async function executeLiveToolCalling(
  providerKey: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama' | 'localOpenAI',
  config: ProviderSetting,
  userQuery: string,
  selectedTools: ToolDefinition[]
): Promise<LiveRunResult> {
  const startTime = performance.now();
  const steps: LiveRunStep[] = [];

  try {
    if (providerKey === 'openai' || providerKey === 'deepseek' || providerKey === 'localOpenAI' || providerKey === 'ollama') {
      return await executeOpenAICompatible(providerKey, config, userQuery, selectedTools, startTime);
    } else if (providerKey === 'anthropic') {
      return await executeAnthropic(config, userQuery, selectedTools, startTime);
    } else if (providerKey === 'gemini') {
      return await executeGemini(config, userQuery, selectedTools, startTime);
    }
    throw new Error(`Unsupported provider: ${providerKey}`);
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      provider: providerKey,
      model: config.model || providerKey,
      success: false,
      latencyMs: elapsed,
      toolCallsCount: 0,
      toolCalls: [],
      finalText: '',
      steps,
      error: err.message || 'Execution error'
    };
  }
}

/**
 * OpenAI-compatible runner (OpenAI, DeepSeek, Local OpenAI, Ollama v1 API)
 */
async function executeOpenAICompatible(
  providerKey: string,
  config: ProviderSetting,
  userQuery: string,
  selectedTools: ToolDefinition[],
  startTime: number
): Promise<LiveRunResult> {
  const steps: LiveRunStep[] = [];
  const toolCalls: LiveToolCall[] = [];

  let baseUrl = 'https://api.openai.com/v1';
  if (providerKey === 'deepseek') baseUrl = 'https://api.deepseek.com';
  if (providerKey === 'ollama') baseUrl = `${config.endpoint || 'http://localhost:11434'}/v1`;
  if (providerKey === 'localOpenAI') baseUrl = config.endpoint || 'http://localhost:1234/v1';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // 1. Initial prompt request payload
  const toolsPayload = selectedTools.map(t => t.openaiSchema);
  const initialMessages = [{ role: 'user', content: userQuery }];

  const reqBody1: any = {
    model: config.model,
    messages: initialMessages
  };
  if (toolsPayload.length > 0) {
    reqBody1.tools = toolsPayload;
    reqBody1.tool_choice = 'auto';
  }

  const call1Start = performance.now();
  const res1 = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody1)
  });
  const call1Latency = Math.round(performance.now() - call1Start);
  const data1 = await res1.json();

  if (!res1.ok) {
    throw new Error(data1.error?.message || `HTTP ${res1.status}: ${res1.statusText}`);
  }

  steps.push({
    stepIndex: 1,
    title: '1. Initial Prompt & Tools Payload',
    stage: 'llm_call',
    description: `Submitted query and ${toolsPayload.length} tool definitions to ${baseUrl}/chat/completions.`,
    requestPayload: reqBody1,
    responsePayload: data1,
    status: res1.status,
    latencyMs: call1Latency,
    timestamp: nowTime()
  });

  const choice = data1.choices?.[0];
  const message = choice?.message;
  const returnedToolCalls = message?.tool_calls || [];

  if (returnedToolCalls.length === 0) {
    // Model replied directly without tool call
    const finalText = message?.content || 'No response text returned.';
    const totalLatency = Math.round(performance.now() - startTime);
    return {
      provider: providerKey,
      model: config.model,
      success: true,
      latencyMs: totalLatency,
      toolCallsCount: 0,
      toolCalls: [],
      finalText,
      steps
    };
  }

  // Model issued tool calls!
  const toolResponseMessages: any[] = [];
  const executionOutputs: string[] = [];

  for (const tc of returnedToolCalls) {
    let parsedArgs: any = {};
    try {
      parsedArgs = JSON.parse(tc.function.arguments);
    } catch {
      parsedArgs = tc.function.arguments;
    }

    toolCalls.push({
      id: tc.id,
      name: tc.function.name,
      arguments: parsedArgs
    });

    const matchedTool = selectedTools.find(t => t.name === tc.function.name);
    let resultObj: any;
    let execMode = 'mock';

    if (matchedTool?.webhookUrl) {
      try {
        const webhookRes = await executeToolWebhook(matchedTool, parsedArgs);
        let parsedBody: any;
        try { parsedBody = JSON.parse(webhookRes.responseBody); } catch { parsedBody = webhookRes.responseBody; }
        resultObj = { status: webhookRes.statusCode, statusText: webhookRes.statusText, body: parsedBody, latencyMs: webhookRes.latencyMs };
        execMode = 'webhook';
      } catch {
        resultObj = matchedTool.mockHandler(parsedArgs);
      }
    } else {
      resultObj = matchedTool ? matchedTool.mockHandler(parsedArgs) : { status: 'Executed successfully' };
    }

    steps.push({
      stepIndex: steps.length + 1,
      title: `2. ${execMode === 'webhook' ? '🌐 Real Webhook' : 'Local Mock'}: ${tc.function.name}`,
      stage: 'tool_execution',
      description: execMode === 'webhook'
        ? `Executed live HTTP request to ${matchedTool?.webhookUrl} with LLM-extracted arguments.`
        : `Executed function handler locally with extracted parameters.`,
      requestPayload: { function: tc.function.name, arguments: parsedArgs },
      responsePayload: resultObj,
      timestamp: nowTime()
    });

    toolResponseMessages.push({
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify(resultObj)
    });
    executionOutputs.push(`${tc.function.name}: ${JSON.stringify(resultObj)}`);
  }

  // 2. Resubmit tool output to LLM
  const fullMessages = [
    ...initialMessages,
    message,
    ...toolResponseMessages
  ];

  const reqBody2 = {
    model: config.model,
    messages: fullMessages
  };

  const call2Start = performance.now();
  const res2 = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody2)
  });
  const call2Latency = Math.round(performance.now() - call2Start);
  const data2 = await res2.json();

  if (!res2.ok) {
    throw new Error(data2.error?.message || `HTTP ${res2.status}: ${res2.statusText}`);
  }

  const finalText = data2.choices?.[0]?.message?.content || executionOutputs.join('\n');

  steps.push({
    stepIndex: steps.length + 1,
    title: '3. Final Answer Synthesis',
    stage: 'final_response',
    description: `Resubmitted tool execution outputs to model to generate synthesized final response.`,
    requestPayload: reqBody2,
    responsePayload: data2,
    status: res2.status,
    latencyMs: call2Latency,
    timestamp: nowTime()
  });

  const totalLatency = Math.round(performance.now() - startTime);
  return {
    provider: providerKey,
    model: config.model,
    success: true,
    latencyMs: totalLatency,
    toolCallsCount: toolCalls.length,
    toolCalls,
    finalText,
    steps
  };
}

/**
 * Anthropic Messages API Runner
 */
async function executeAnthropic(
  config: ProviderSetting,
  userQuery: string,
  selectedTools: ToolDefinition[],
  startTime: number
): Promise<LiveRunResult> {
  const steps: LiveRunStep[] = [];
  const toolCalls: LiveToolCall[] = [];

  if (!config.apiKey) {
    throw new Error('Anthropic API key is required');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };

  const toolsPayload = selectedTools.map(t => t.anthropicSchema);
  const initialMessages = [{ role: 'user', content: userQuery }];

  const reqBody1: any = {
    model: config.model,
    max_tokens: 1024,
    messages: initialMessages
  };
  if (toolsPayload.length > 0) {
    reqBody1.tools = toolsPayload;
  }

  const call1Start = performance.now();
  const res1 = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody1)
  });
  const call1Latency = Math.round(performance.now() - call1Start);
  const data1 = await res1.json();

  if (!res1.ok) {
    throw new Error(data1.error?.message || `HTTP ${res1.status}: ${res1.statusText}`);
  }

  steps.push({
    stepIndex: 1,
    title: '1. User Request & Tools Payload',
    stage: 'llm_call',
    description: `Submitted query and tools to Anthropic Messages API.`,
    requestPayload: reqBody1,
    responsePayload: data1,
    status: res1.status,
    latencyMs: call1Latency,
    timestamp: nowTime()
  });

  const contentBlocks = data1.content || [];
  const toolUseBlocks = contentBlocks.filter((b: any) => b.type === 'tool_use');

  if (toolUseBlocks.length === 0) {
    const textBlock = contentBlocks.find((b: any) => b.type === 'text');
    const finalText = textBlock?.text || 'No response text returned.';
    const totalLatency = Math.round(performance.now() - startTime);
    return {
      provider: 'anthropic',
      model: config.model,
      success: true,
      latencyMs: totalLatency,
      toolCallsCount: 0,
      toolCalls: [],
      finalText,
      steps
    };
  }

  // Process Tool Calls
  const toolResultBlocks: any[] = [];
  const executionOutputs: string[] = [];

  for (const tu of toolUseBlocks) {
    toolCalls.push({
      id: tu.id,
      name: tu.name,
      arguments: tu.input
    });

    const matchedTool = selectedTools.find(t => t.name === tu.name);
    let resultObj: any;
    let execMode = 'mock';

    if (matchedTool?.webhookUrl) {
      try {
        const webhookRes = await executeToolWebhook(matchedTool, tu.input);
        let parsedBody: any;
        try { parsedBody = JSON.parse(webhookRes.responseBody); } catch { parsedBody = webhookRes.responseBody; }
        resultObj = { status: webhookRes.statusCode, statusText: webhookRes.statusText, body: parsedBody, latencyMs: webhookRes.latencyMs };
        execMode = 'webhook';
      } catch {
        resultObj = matchedTool.mockHandler(tu.input);
      }
    } else {
      resultObj = matchedTool ? matchedTool.mockHandler(tu.input) : { status: 'Executed successfully' };
    }

    steps.push({
      stepIndex: steps.length + 1,
      title: `2. ${execMode === 'webhook' ? '🌐 Real Webhook' : 'Local Mock'}: ${tu.name}`,
      stage: 'tool_execution',
      description: execMode === 'webhook'
        ? `Executed live HTTP request to ${matchedTool?.webhookUrl} with LLM-extracted arguments.`
        : `Executed tool locally for input_schema object.`,
      requestPayload: { tool: tu.name, input: tu.input },
      responsePayload: resultObj,
      timestamp: nowTime()
    });

    toolResultBlocks.push({
      type: 'tool_result',
      tool_use_id: tu.id,
      content: JSON.stringify(resultObj)
    });
    executionOutputs.push(`${tu.name}: ${JSON.stringify(resultObj)}`);
  }

  // Submit tool result under role="user"
  const fullMessages = [
    ...initialMessages,
    { role: 'assistant', content: contentBlocks },
    { role: 'user', content: toolResultBlocks }
  ];

  const reqBody2 = {
    model: config.model,
    max_tokens: 1024,
    messages: fullMessages,
    tools: toolsPayload
  };

  const call2Start = performance.now();
  const res2 = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody2)
  });
  const call2Latency = Math.round(performance.now() - call2Start);
  const data2 = await res2.json();

  if (!res2.ok) {
    throw new Error(data2.error?.message || `HTTP ${res2.status}: ${res2.statusText}`);
  }

  const textBlock2 = data2.content?.find((b: any) => b.type === 'text');
  const finalText = textBlock2?.text || executionOutputs.join('\n');

  steps.push({
    stepIndex: steps.length + 1,
    title: '3. Claude Final Answer Synthesis',
    stage: 'final_response',
    description: `Submitted tool_result blocks to Claude to generate final response.`,
    requestPayload: reqBody2,
    responsePayload: data2,
    status: res2.status,
    latencyMs: call2Latency,
    timestamp: nowTime()
  });

  const totalLatency = Math.round(performance.now() - startTime);
  return {
    provider: 'anthropic',
    model: config.model,
    success: true,
    latencyMs: totalLatency,
    toolCallsCount: toolCalls.length,
    toolCalls,
    finalText,
    steps
  };
}

/**
 * Google Gemini REST Runner
 */
async function executeGemini(
  config: ProviderSetting,
  userQuery: string,
  selectedTools: ToolDefinition[],
  startTime: number
): Promise<LiveRunResult> {
  const steps: LiveRunStep[] = [];
  const toolCalls: LiveToolCall[] = [];

  if (!config.apiKey) {
    throw new Error('Google Gemini API key is required');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  // Convert tools into Gemini functionDeclarations format
  const functionDeclarations = selectedTools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.openaiSchema.function.parameters
  }));

  const contents = [
    {
      role: 'user',
      parts: [{ text: userQuery }]
    }
  ];

  const reqBody1: any = { contents };
  if (functionDeclarations.length > 0) {
    reqBody1.tools = [{ functionDeclarations }];
  }

  const call1Start = performance.now();
  const res1 = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody1)
  });
  const call1Latency = Math.round(performance.now() - call1Start);
  const data1 = await res1.json();

  if (!res1.ok) {
    throw new Error(data1.error?.message || `HTTP ${res1.status}: ${res1.statusText}`);
  }

  steps.push({
    stepIndex: 1,
    title: '1. User Request & Function Declarations Payload',
    stage: 'llm_call',
    description: `Submitted request to Gemini generateContent API with ${functionDeclarations.length} function declarations.`,
    requestPayload: reqBody1,
    responsePayload: data1,
    status: res1.status,
    latencyMs: call1Latency,
    timestamp: nowTime()
  });

  const candidate = data1.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const functionCallParts = parts.filter((p: any) => p.functionCall);

  if (functionCallParts.length === 0) {
    const textPart = parts.find((p: any) => p.text);
    const finalText = textPart?.text || 'No response text returned.';
    const totalLatency = Math.round(performance.now() - startTime);
    return {
      provider: 'gemini',
      model: config.model,
      success: true,
      latencyMs: totalLatency,
      toolCallsCount: 0,
      toolCalls: [],
      finalText,
      steps
    };
  }

  // Execute Gemini tool calls
  const functionResponseParts: any[] = [];
  const executionOutputs: string[] = [];

  for (const fcp of functionCallParts) {
    const fc = fcp.functionCall;
    const callId = `gemini_call_${Math.random().toString(36).substring(2, 8)}`;
    toolCalls.push({
      id: callId,
      name: fc.name,
      arguments: fc.args
    });

    const matchedTool = selectedTools.find(t => t.name === fc.name);
    let resultObj: any;
    let execMode = 'mock';

    if (matchedTool?.webhookUrl) {
      try {
        const webhookRes = await executeToolWebhook(matchedTool, fc.args);
        let parsedBody: any;
        try { parsedBody = JSON.parse(webhookRes.responseBody); } catch { parsedBody = webhookRes.responseBody; }
        resultObj = { status: webhookRes.statusCode, statusText: webhookRes.statusText, body: parsedBody, latencyMs: webhookRes.latencyMs };
        execMode = 'webhook';
      } catch {
        resultObj = matchedTool.mockHandler(fc.args);
      }
    } else {
      resultObj = matchedTool ? matchedTool.mockHandler(fc.args) : { status: 'Executed successfully' };
    }

    steps.push({
      stepIndex: steps.length + 1,
      title: `2. ${execMode === 'webhook' ? '🌐 Real Webhook' : 'Local Mock'}: ${fc.name}`,
      stage: 'tool_execution',
      description: execMode === 'webhook'
        ? `Executed live HTTP request to ${matchedTool?.webhookUrl} with Gemini-extracted arguments.`
        : `Executed function locally with Gemini arguments object.`,
      requestPayload: { function: fc.name, args: fc.args },
      responsePayload: resultObj,
      timestamp: nowTime()
    });

    functionResponseParts.push({
      functionResponse: {
        name: fc.name,
        response: { name: fc.name, content: resultObj }
      }
    });
    executionOutputs.push(`${fc.name}: ${JSON.stringify(resultObj)}`);
  }

  // Resubmit functionResponse parts to Gemini
  const updatedContents = [
    ...contents,
    candidate.content,
    {
      role: 'user',
      parts: functionResponseParts
    }
  ];

  const reqBody2 = {
    contents: updatedContents,
    tools: reqBody1.tools
  };

  const call2Start = performance.now();
  const res2 = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody2)
  });
  const call2Latency = Math.round(performance.now() - call2Start);
  const data2 = await res2.json();

  if (!res2.ok) {
    throw new Error(data2.error?.message || `HTTP ${res2.status}: ${res2.statusText}`);
  }

  const parts2 = data2.candidates?.[0]?.content?.parts || [];
  const textPart2 = parts2.find((p: any) => p.text);
  const finalText = textPart2?.text || executionOutputs.join('\n');

  steps.push({
    stepIndex: steps.length + 1,
    title: '3. Gemini Final Response Synthesis',
    stage: 'final_response',
    description: `Submitted functionResponse parts to Gemini to synthesize final text answer.`,
    requestPayload: reqBody2,
    responsePayload: data2,
    status: res2.status,
    latencyMs: call2Latency,
    timestamp: nowTime()
  });

  const totalLatency = Math.round(performance.now() - startTime);
  return {
    provider: 'gemini',
    model: config.model,
    success: true,
    latencyMs: totalLatency,
    toolCallsCount: toolCalls.length,
    toolCalls,
    finalText,
    steps
  };
}
