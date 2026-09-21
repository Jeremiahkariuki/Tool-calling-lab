import type { ToolDefinition } from './openapiParser';

export interface SimulationStep {
  stepIndex: number;
  title: string;
  provider: 'openai' | 'anthropic';
  stage: 'user_prompt' | 'llm_call' | 'tool_call' | 'tool_execution' | 'tool_response' | 'final_response';
  description: string;
  payload: any;
  timestamp: string;
}

export interface SimulationResult {
  steps: SimulationStep[];
  finalText: string;
}

/**
 * Simulates a full multi-turn OpenAI Tool Calling execution loop.
 */
export function runOpenAISimulation(
  userQuery: string,
  selectedTools: ToolDefinition[]
): SimulationResult {
  const steps: SimulationStep[] = [];
  const now = () => new Date().toLocaleTimeString();

  // Step 1: User Message
  const initialMessages = [
    { role: 'user', content: userQuery }
  ];
  const toolsPayload = selectedTools.map((t) => t.openaiSchema);

  steps.push({
    stepIndex: 1,
    title: '1. User Request Received',
    provider: 'openai',
    stage: 'user_prompt',
    description: 'User submits initial natural language prompt to OpenAI Chat Completions API.',
    payload: {
      model: 'gpt-4o',
      messages: initialMessages,
      tools: toolsPayload,
      tool_choice: 'auto'
    },
    timestamp: now()
  });

  // Step 2: Match relevant tools base on query keyword
  const matchedTools = selectedTools.filter((t) => {
    const q = userQuery.toLowerCase();
    if (t.id === 'get_weather' && (q.includes('weather') || q.includes('temp') || q.includes('tokyo') || q.includes('paris') || q.includes('london') || q.includes('york'))) return true;
    if (t.id === 'get_stock_price' && (q.includes('stock') || q.includes('price') || q.includes('aapl') || q.includes('nvda') || q.includes('tsla') || q.includes('share'))) return true;
    if (t.id === 'search_database' && (q.includes('search') || q.includes('find') || q.includes('spec') || q.includes('docs') || q.includes('knowledge'))) return true;
    return false;
  });

  const toolsToCall = matchedTools.length > 0 ? matchedTools : (selectedTools.length > 0 ? [selectedTools[0]] : []);

  // Step 3: LLM generates tool call(s)
  const toolCallsPayload = toolsToCall.map((t) => {
    let args: any = {};
    if (t.id === 'get_weather') args = { location: 'Tokyo, Japan', unit: 'celsius' };
    if (t.id === 'get_stock_price') args = { ticker: 'AAPL' };
    if (t.id === 'search_database') args = { query: userQuery, max_results: 3 };

    return {
      id: `call_${Math.random().toString(36).substring(2, 10)}`,
      type: 'function',
      function: {
        name: t.name,
        arguments: JSON.stringify(args)
      }
    };
  });

  const assistantMessagePayload = {
    role: 'assistant',
    content: null,
    tool_calls: toolCallsPayload
  };

  steps.push({
    stepIndex: 2,
    title: '2. LLM Tool Selection & Call Generation',
    provider: 'openai',
    stage: 'tool_call',
    description: `OpenAI model returns role="assistant" with tool_calls array (${toolCallsPayload.length} call${toolCallsPayload.length > 1 ? 's' : ''}).`,
    payload: {
      choices: [
        {
          index: 0,
          message: assistantMessagePayload,
          finish_reason: 'tool_calls'
        }
      ]
    },
    timestamp: now()
  });

  // Step 4: Execute tools locally & create role="tool" messages
  const toolResponseMessages: any[] = [];
  const executionResultsSummary: string[] = [];

  toolCallsPayload.forEach((tc) => {
    const matched = selectedTools.find((t) => t.name === tc.function.name);
    const parsedArgs = JSON.parse(tc.function.arguments);
    const resultObj = matched ? matched.mockHandler(parsedArgs) : { result: 'Mock execution complete' };

    steps.push({
      stepIndex: steps.length + 1,
      title: `3. Tool Execution: ${tc.function.name}`,
      provider: 'openai',
      stage: 'tool_execution',
      description: `Client code executes function locally with arguments: ${tc.function.arguments}`,
      payload: {
        function_name: tc.function.name,
        tool_call_id: tc.id,
        parsed_arguments: parsedArgs,
        returned_output: resultObj
      },
      timestamp: now()
    });

    const toolMsg = {
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify(resultObj)
    };
    toolResponseMessages.push(toolMsg);
    executionResultsSummary.push(`${tc.function.name}: ${JSON.stringify(resultObj)}`);
  });

  // Step 5: Second API Call with conversation history + tool messages
  const fullConversationHistory = [
    ...initialMessages,
    assistantMessagePayload,
    ...toolResponseMessages
  ];

  steps.push({
    stepIndex: steps.length + 1,
    title: '4. Resubmitting Tool Results to LLM',
    provider: 'openai',
    stage: 'tool_response',
    description: 'Client sends updated conversation history containing role="tool" response messages.',
    payload: {
      model: 'gpt-4o',
      messages: fullConversationHistory
    },
    timestamp: now()
  });

  // Step 6: Final Answer Generation
  let summaryText = `Here is the requested information:\n\n`;
  if (executionResultsSummary.length > 0) {
    summaryText += executionResultsSummary.map(s => `• ${s}`).join('\n');
  } else {
    summaryText += `I completed your request successfully using tool function calls.`;
  }

  steps.push({
    stepIndex: steps.length + 1,
    title: '5. Final Assistant Answer Synthesis',
    provider: 'openai',
    stage: 'final_response',
    description: 'Model synthesizes the tool outputs into a natural language response.',
    payload: {
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: summaryText
          },
          finish_reason: 'stop'
        }
      ]
    },
    timestamp: now()
  });

  return { steps, finalText: summaryText };
}

/**
 * Simulates a full multi-turn Anthropic Tool Use execution loop.
 */
export function runAnthropicSimulation(
  userQuery: string,
  selectedTools: ToolDefinition[]
): SimulationResult {
  const steps: SimulationStep[] = [];
  const now = () => new Date().toLocaleTimeString();

  // Step 1: Initial Request
  const toolsPayload = selectedTools.map((t) => t.anthropicSchema);

  steps.push({
    stepIndex: 1,
    title: '1. User Request Received',
    provider: 'anthropic',
    stage: 'user_prompt',
    description: 'User sends prompt to Anthropic Messages API with tools list.',
    payload: {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      tools: toolsPayload,
      messages: [
        { role: 'user', content: userQuery }
      ]
    },
    timestamp: now()
  });

  // Step 2: Match tools
  const matchedTools = selectedTools.filter((t) => {
    const q = userQuery.toLowerCase();
    if (t.id === 'get_weather' && (q.includes('weather') || q.includes('temp') || q.includes('tokyo') || q.includes('paris') || q.includes('london') || q.includes('york'))) return true;
    if (t.id === 'get_stock_price' && (q.includes('stock') || q.includes('price') || q.includes('aapl') || q.includes('nvda') || q.includes('tsla') || q.includes('share'))) return true;
    if (t.id === 'search_database' && (q.includes('search') || q.includes('find') || q.includes('spec') || q.includes('docs') || q.includes('knowledge'))) return true;
    return false;
  });

  const toolsToCall = matchedTools.length > 0 ? matchedTools : (selectedTools.length > 0 ? [selectedTools[0]] : []);

  // Anthropic tool_use content blocks
  const toolUseBlocks = toolsToCall.map((t) => {
    let input: any = {};
    if (t.id === 'get_weather') input = { location: 'Tokyo, Japan', unit: 'celsius' };
    if (t.id === 'get_stock_price') input = { ticker: 'AAPL' };
    if (t.id === 'search_database') input = { query: userQuery, max_results: 3 };

    return {
      type: 'tool_use',
      id: `toolu_${Math.random().toString(36).substring(2, 12)}`,
      name: t.name,
      input: input
    };
  });

  const assistantMessagePayload = {
    role: 'assistant',
    content: [
      { type: 'text', text: "I'll fetch that information for you using the available tools." },
      ...toolUseBlocks
    ]
  };

  steps.push({
    stepIndex: 2,
    title: '2. Anthropic Tool Use Decision',
    provider: 'anthropic',
    stage: 'tool_call',
    description: 'Claude returns stop_reason="tool_use" with structured content blocks.',
    payload: {
      id: `msg_${Math.random().toString(36).substring(2, 10)}`,
      type: 'message',
      role: 'assistant',
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'tool_use',
      content: assistantMessagePayload.content
    },
    timestamp: now()
  });

  // Step 3: Tool Execution & Result Content Blocks
  const toolResultBlocks: any[] = [];
  const executionResultsSummary: string[] = [];

  toolUseBlocks.forEach((tu) => {
    const matched = selectedTools.find((t) => t.name === tu.name);
    const resultObj = matched ? matched.mockHandler(tu.input) : { result: 'Mock execution complete' };

    steps.push({
      stepIndex: steps.length + 1,
      title: `3. Tool Execution: ${tu.name}`,
      provider: 'anthropic',
      stage: 'tool_execution',
      description: `Client executes function locally. Received parsed input object directly.`,
      payload: {
        tool_use_id: tu.id,
        tool_name: tu.name,
        input_object: tu.input,
        result: resultObj
      },
      timestamp: now()
    });

    toolResultBlocks.push({
      type: 'tool_result',
      tool_use_id: tu.id,
      content: JSON.stringify(resultObj),
      is_error: false
    });
    executionResultsSummary.push(`${tu.name}: ${JSON.stringify(resultObj)}`);
  });

  // Step 4: Submit user role message containing tool_result content array
  const userToolResultMessage = {
    role: 'user',
    content: toolResultBlocks
  };

  steps.push({
    stepIndex: steps.length + 1,
    title: '4. Tool Result Submission (User Role)',
    provider: 'anthropic',
    stage: 'tool_response',
    description: 'Client submits tool_result content blocks under role="user".',
    payload: {
      messages: [
        { role: 'user', content: userQuery },
        assistantMessagePayload,
        userToolResultMessage
      ]
    },
    timestamp: now()
  });

  // Step 5: Final Response Synthesis
  let summaryText = `Based on the tool results:\n\n`;
  if (executionResultsSummary.length > 0) {
    summaryText += executionResultsSummary.map(s => `• ${s}`).join('\n');
  } else {
    summaryText += `I've successfully gathered all required data via Claude Tool Use.`;
  }

  steps.push({
    stepIndex: steps.length + 1,
    title: '5. Claude Final Response Synthesis',
    provider: 'anthropic',
    stage: 'final_response',
    description: 'Claude synthesizes tool results into final answer response.',
    payload: {
      id: `msg_${Math.random().toString(36).substring(2, 10)}`,
      type: 'message',
      role: 'assistant',
      stop_reason: 'end_turn',
      content: [
        {
          type: 'text',
          text: summaryText
        }
      ]
    },
    timestamp: now()
  });

  return { steps, finalText: summaryText };
}
