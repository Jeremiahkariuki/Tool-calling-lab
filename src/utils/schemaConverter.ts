export interface OpenAIFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
  strict?: boolean;
}

export interface OpenAITool {
  type: 'function';
  function: OpenAIFunction;
}

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}

export interface ConversionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings: string[];
}

/**
 * Converts an OpenAI Tool or Function definition into an Anthropic Tool definition.
 */
export function convertOpenAIToAnthropic(input: any): ConversionResult<AnthropicTool> {
  const warnings: string[] = [];

  try {
    let fnObj: OpenAIFunction;

    if (typeof input === 'string') {
      input = JSON.parse(input);
    }

    if (input.type === 'function' && input.function) {
      fnObj = input.function;
    } else if (input.name && (input.parameters || input.description !== undefined)) {
      fnObj = input;
    } else {
      return {
        success: false,
        error: 'Invalid OpenAI function/tool structure. Expected { type: "function", function: { ... } } or { name, description, parameters }',
        warnings: []
      };
    }

    if (!fnObj.name) {
      return {
        success: false,
        error: 'OpenAI function definition missing required "name" field.',
        warnings: []
      };
    }

    if (fnObj.strict !== undefined) {
      warnings.push('OpenAI "strict: true" flag is not part of Anthropic Tool spec and was omitted.');
    }

    const anthropicTool: AnthropicTool = {
      name: fnObj.name,
      description: fnObj.description || '',
      input_schema: fnObj.parameters || { type: 'object', properties: {} }
    };

    // Ensure input_schema has type: 'object'
    if (!anthropicTool.input_schema.type) {
      anthropicTool.input_schema.type = 'object';
      warnings.push('Added missing "type: object" to Anthropic input_schema.');
    }

    return {
      success: true,
      data: anthropicTool,
      warnings
    };
  } catch (err: any) {
    return {
      success: false,
      error: `JSON Parsing Error: ${err.message}`,
      warnings: []
    };
  }
}

/**
 * Converts an Anthropic Tool definition into an OpenAI Tool definition.
 */
export function convertAnthropicToOpenAI(input: any): ConversionResult<OpenAITool> {
  const warnings: string[] = [];

  try {
    if (typeof input === 'string') {
      input = JSON.parse(input);
    }

    if (!input.name) {
      return {
        success: false,
        error: 'Anthropic tool definition missing required "name" field.',
        warnings: []
      };
    }

    const openAiTool: OpenAITool = {
      type: 'function',
      function: {
        name: input.name,
        description: input.description || '',
        parameters: input.input_schema || { type: 'object', properties: {} }
      }
    };

    if (!openAiTool.function.parameters.type) {
      openAiTool.function.parameters.type = 'object';
      warnings.push('Added missing "type: object" to OpenAI function parameters.');
    }

    return {
      success: true,
      data: openAiTool,
      warnings
    };
  } catch (err: any) {
    return {
      success: false,
      error: `JSON Parsing Error: ${err.message}`,
      warnings: []
    };
  }
}

/**
 * Safely format JSON string with 2 space indentation.
 */
export function safeFormatJson(input: string | object): string {
  try {
    const obj = typeof input === 'string' ? JSON.parse(input) : input;
    return JSON.stringify(obj, null, 2);
  } catch {
    return typeof input === 'string' ? input : String(input);
  }
}
