import type { OpenAITool, AnthropicTool } from './schemaConverter';

export interface PrebuiltTool {
  id: string;
  name: string;
  description: string;
  category: 'weather' | 'finance' | 'code' | 'search';
  openaiSchema: OpenAITool;
  anthropicSchema: AnthropicTool;
  mockHandler: (args: any) => any;
}

export const PREBUILT_TOOLS: PrebuiltTool[] = [
  {
    id: 'get_weather',
    name: 'get_current_weather',
    description: 'Get current weather conditions, temperature, and humidity for a specified city.',
    category: 'weather',
    openaiSchema: {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: 'Get current weather conditions, temperature, and humidity for a specified city.',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City and state/country, e.g. San Francisco, CA or Tokyo, Japan'
            },
            unit: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature unit preference'
            }
          },
          required: ['location']
        }
      }
    },
    anthropicSchema: {
      name: 'get_current_weather',
      description: 'Get current weather conditions, temperature, and humidity for a specified city.',
      input_schema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City and state/country, e.g. San Francisco, CA or Tokyo, Japan'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit preference'
          }
        },
        required: ['location']
      }
    },
    mockHandler: (args) => {
      const loc = args.location || 'Unknown City';
      const unit = args.unit || 'celsius';
      const temp = unit === 'celsius' ? '22°C' : '71.6°F';
      return {
        location: loc,
        temperature: temp,
        condition: 'Partly Cloudy',
        humidity: '45%',
        wind_speed: '12 km/h'
      };
    }
  },
  {
    id: 'get_stock_price',
    name: 'get_stock_price',
    description: 'Fetch real-time stock quotes, volume, and daily high/low for a given ticker symbol.',
    category: 'finance',
    openaiSchema: {
      type: 'function',
      function: {
        name: 'get_stock_price',
        description: 'Fetch real-time stock quotes, volume, and daily high/low for a given ticker symbol.',
        parameters: {
          type: 'object',
          properties: {
            ticker: {
              type: 'string',
              description: 'Stock ticker symbol (e.g., AAPL, NVDA, TSLA, MSFT)'
            }
          },
          required: ['ticker']
        }
      }
    },
    anthropicSchema: {
      name: 'get_stock_price',
      description: 'Fetch real-time stock quotes, volume, and daily high/low for a given ticker symbol.',
      input_schema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Stock ticker symbol (e.g., AAPL, NVDA, TSLA, MSFT)'
          }
        },
        required: ['ticker']
      }
    },
    mockHandler: (args) => {
      const ticker = (args.ticker || 'AAPL').toUpperCase();
      const prices: Record<string, number> = {
        AAPL: 224.50,
        NVDA: 128.20,
        TSLA: 215.80,
        MSFT: 448.90,
        GOOGL: 178.40
      };
      const price = prices[ticker] || 150.00;
      return {
        ticker,
        current_price: `$${price.toFixed(2)}`,
        change: '+2.45 (+1.10%)',
        volume: '42.8M',
        currency: 'USD'
      };
    }
  },
  {
    id: 'search_database',
    name: 'search_knowledge_base',
    description: 'Search internal knowledge base or documents for answers to specific user questions.',
    category: 'search',
    openaiSchema: {
      type: 'function',
      function: {
        name: 'search_knowledge_base',
        description: 'Search internal knowledge base or documents for answers to specific user questions.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query string'
            },
            max_results: {
              type: 'integer',
              description: 'Maximum number of search results to return (1-10)'
            }
          },
          required: ['query']
        }
      }
    },
    anthropicSchema: {
      name: 'search_knowledge_base',
      description: 'Search internal knowledge base or documents for answers to specific user questions.',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query string'
          },
          max_results: {
            type: 'integer',
            description: 'Maximum number of search results to return (1-10)'
          }
        },
        required: ['query']
      }
    },
    mockHandler: (args) => {
      return {
        query: args.query,
        results_found: 2,
        matches: [
          { title: 'Tool Calling Spec Overview', excerpt: 'Tool calling allows models to execute external functions...' },
          { title: 'API Integration Best Practices', excerpt: 'Always validate JSON schema parameters before tool invocation...' }
        ]
      };
    }
  }
];

export interface ProtocolComparisonItem {
  feature: string;
  openai: string;
  anthropic: string;
  explanation: string;
}

export const PROTOCOL_COMPARISON: ProtocolComparisonItem[] = [
  {
    feature: 'Tool Schema Envelope',
    openai: '`{ type: "function", function: { name, description, parameters } }`',
    anthropic: '`{ name, description, input_schema }`',
    explanation: 'OpenAI nests function definitions inside a `{ type: "function", function: ... }` object, while Anthropic defines tool name, description, and schema directly at top-level.'
  },
  {
    feature: 'JSON Schema Location',
    openai: '`function.parameters`',
    anthropic: '`input_schema`',
    explanation: 'Both use JSON Schema specifications (`type: "object"`), but named `parameters` in OpenAI vs `input_schema` in Anthropic.'
  },
  {
    feature: 'Tool Call Output Format',
    openai: '`role: "assistant"`, `tool_calls: [{ id, type: "function", function: { name, arguments: "STRINGIFIED_JSON" } }]`',
    anthropic: '`role: "assistant"`, `content: [{ type: "tool_use", id, name, input: OBJECT }]`',
    explanation: 'OpenAI stringifies tool call arguments as a JSON string inside `arguments`. Anthropic parses arguments directly as a JSON `input` object in a content block.'
  },
  {
    feature: 'Tool Result Input Format',
    openai: '`role: "tool"`, `tool_call_id: "..."`, `content: "STRING"`',
    anthropic: '`role: "user"`, `content: [{ type: "tool_result", tool_use_id: "...", content: "..." }]`',
    explanation: 'OpenAI uses a dedicated message role `tool`. Anthropic passes tool results under `role: "user"` using a `tool_result` content block.'
  },
  {
    feature: 'Tool Choice Directives',
    openai: '`tool_choice: "auto" | "none" | "required" | { type: "function", function: { name } }`',
    anthropic: '`tool_choice: { type: "auto" } | { type: "any" } | { type: "tool", name }`',
    explanation: 'Forcing tool selection uses `"required"` in OpenAI vs `{ type: "any" }` in Anthropic. Specific tool naming uses `{ type: "function" }` vs `{ type: "tool" }`.'
  },
  {
    feature: 'Error Reporting',
    openai: 'Pass error message as content string inside `role: "tool"` message.',
    anthropic: '`is_error: true` boolean flag inside `tool_result` block + error content.',
    explanation: 'Anthropic has an explicit `is_error` flag so the model knows the tool execution encountered an unhandled exception or system failure.'
  }
];

export interface Challenge {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  instructions: string;
  initialCode: string;
  expectedOutputKey: string;
  hint: string;
  solution: string;
}

export const MASTERY_CHALLENGES: Challenge[] = [
  {
    id: 'ch1',
    title: 'Challenge 1: Fix Malformed OpenAI Function Schema',
    difficulty: 'Beginner',
    description: 'The function schema below is missing essential JSON schema fields required by OpenAI.',
    instructions: 'Add `"type": "object"` to `parameters` and make `"location"` a required field array.',
    initialCode: JSON.stringify({
      type: "function",
      function: {
        name: "get_weather",
        description: "Get current weather for location",
        parameters: {
          properties: {
            location: { type: "string", description: "City name" }
          }
        }
      }
    }, null, 2),
    expectedOutputKey: 'parameters.type',
    hint: 'Ensure parameters has `type: "object"` and `required: ["location"]`.',
    solution: JSON.stringify({
      type: "function",
      function: {
        name: "get_weather",
        description: "Get current weather for location",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "City name" }
          },
          required: ["location"]
        }
      }
    }, null, 2)
  },
  {
    id: 'ch2',
    title: 'Challenge 2: Convert OpenAI Schema to Anthropic Format',
    difficulty: 'Intermediate',
    description: 'Convert this OpenAI function wrapper into an Anthropic tool definition.',
    instructions: 'Remove `{ type: "function", function: ... }`, rename `parameters` to `input_schema`.',
    initialCode: JSON.stringify({
      type: "function",
      function: {
        name: "calculate_tax",
        description: "Calculate sales tax for amount",
        parameters: {
          type: "object",
          properties: {
            amount: { type: "number" },
            state: { type: "string" }
          },
          required: ["amount", "state"]
        }
      }
    }, null, 2),
    expectedOutputKey: 'input_schema',
    hint: 'Anthropic tools take top-level `name`, `description`, and `input_schema`.',
    solution: JSON.stringify({
      name: "calculate_tax",
      description: "Calculate sales tax for amount",
      input_schema: {
        type: "object",
        properties: {
          amount: { type: "number" },
          state: { type: "string" }
        },
        required: ["amount", "state"]
      }
    }, null, 2)
  },
  {
    id: 'ch3',
    title: 'Challenge 3: Construct Anthropic Tool Result Block',
    difficulty: 'Intermediate',
    description: 'Create a user message payload returning tool execution result with ID `toolu_12345`.',
    instructions: 'Construct an Anthropic user message containing a `tool_result` content block with `tool_use_id: "toolu_12345"` and result `"Temperature: 24C"`.',
    initialCode: JSON.stringify({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "",
          content: ""
        }
      ]
    }, null, 2),
    expectedOutputKey: 'content[0].tool_use_id',
    hint: 'Fill in `tool_use_id` as "toolu_12345" and `content` as "Temperature: 24C".',
    solution: JSON.stringify({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "toolu_12345",
          content: "Temperature: 24C"
        }
      ]
    }, null, 2)
  }
];
