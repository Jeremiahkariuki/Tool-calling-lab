export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  isCustom?: boolean;
  source?: 'prebuilt' | 'openapi' | 'manual';
  webhookUrl?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  openaiSchema: {
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
      };
    };
  };
  anthropicSchema: {
    name: string;
    description: string;
    input_schema: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
  mockHandler: (args: any) => any;
}

export interface ParseResult {
  success: boolean;
  tools: ToolDefinition[];
  apiTitle?: string;
  apiVersion?: string;
  serverUrl?: string;
  error?: string;
  warnings: string[];
}

/**
 * Normalizes an API path and method into a clean function identifier.
 * e.g., POST /pets/{petId}/uploadImage -> post_pets_by_petid_upload_image
 */
export function sanitizeFunctionName(method: string, path: string, operationId?: string): string {
  if (operationId) {
    const cleanId = operationId.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanId)) {
      return cleanId.slice(0, 64);
    }
  }

  const cleanPath = path
    .replace(/\{([^}]+)\}/g, 'by_$1')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  const name = `${method.toLowerCase()}${cleanPath}`;
  return name.replace(/^_+|_+$/g, '').slice(0, 64);
}

/**
 * Simple JSON / YAML parser helper.
 */
function parseSpecContent(content: string): any {
  const trimmed = content.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(content);
  }

  // Basic key-value parser for simple YAML if non-JSON
  // For standard specs, users paste JSON or simple key structures
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error('Please provide a valid JSON OpenAPI/Swagger specification.');
  }
}

/**
 * Main parser converting OpenAPI 3.0/3.1 or Swagger 2.0 to AI ToolDefinitions.
 */
export function parseOpenApiSpec(content: string): ParseResult {
  const warnings: string[] = [];
  try {
    const spec = parseSpecContent(content);

    const apiTitle = spec.info?.title || 'Imported API';
    const apiVersion = spec.info?.version || '1.0.0';
    
    // Determine base server URL
    let serverUrl = '';
    if (spec.servers && spec.servers.length > 0) {
      serverUrl = spec.servers[0].url || '';
    } else if (spec.host) {
      const scheme = (spec.schemes && spec.schemes[0]) || 'https';
      serverUrl = `${scheme}://${spec.host}${spec.basePath || ''}`;
    }

    const paths = spec.paths || {};
    const tools: ToolDefinition[] = [];

    Object.keys(paths).forEach((pathKey) => {
      const pathItem = paths[pathKey];
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];

      httpMethods.forEach((method) => {
        if (!pathItem[method]) return;

        const op = pathItem[method];
        const rawName = sanitizeFunctionName(method, pathKey, op.operationId);
        const description = op.summary || op.description || `${method.toUpperCase()} ${pathKey}`;

        // Build JSON Schema parameters
        const properties: Record<string, any> = {};
        const required: string[] = [];

        // Parse path/query parameters
        const params = [...(pathItem.parameters || []), ...(op.parameters || [])];
        params.forEach((p: any) => {
          if (!p.name) return;
          const paramName = p.name.replace(/[^a-zA-Z0-9_]/g, '_');
          const schema = p.schema || { type: p.type || 'string' };

          properties[paramName] = {
            type: schema.type || 'string',
            description: p.description || schema.description || `Parameter ${p.name}`
          };

          if (schema.enum) properties[paramName].enum = schema.enum;
          if (p.required) required.push(paramName);
        });

        // Parse Request Body (OpenAPI 3.0)
        if (op.requestBody?.content) {
          const jsonContent = op.requestBody.content['application/json'];
          if (jsonContent?.schema?.properties) {
            const bodyProps = jsonContent.schema.properties;
            const bodyRequired = jsonContent.schema.required || [];

            Object.keys(bodyProps).forEach((propKey) => {
              const pSchema = bodyProps[propKey];
              properties[propKey] = {
                type: pSchema.type || 'string',
                description: pSchema.description || `Field ${propKey}`
              };
              if (pSchema.enum) properties[propKey].enum = pSchema.enum;
              if (bodyRequired.includes(propKey) && !required.includes(propKey)) {
                required.push(propKey);
              }
            });
          }
        }

        const paramSchema = {
          type: 'object' as const,
          properties,
          ...(required.length > 0 ? { required } : {})
        };

        const targetWebhookUrl = serverUrl ? `${serverUrl.replace(/\/$/, '')}${pathKey}` : '';

        const tool: ToolDefinition = {
          id: `openapi_${rawName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: rawName,
          description: description.slice(0, 280),
          category: 'openapi',
          isCustom: true,
          source: 'openapi',
          webhookUrl: targetWebhookUrl,
          httpMethod: method.toUpperCase() as any,
          parameters: paramSchema,
          openaiSchema: {
            type: 'function',
            function: {
              name: rawName,
              description: description.slice(0, 280),
              parameters: paramSchema
            }
          },
          anthropicSchema: {
            name: rawName,
            description: description.slice(0, 280),
            input_schema: paramSchema
          },
          mockHandler: (args: any) => ({
            status: 200,
            importedFrom: apiTitle,
            endpoint: `${method.toUpperCase()} ${pathKey}`,
            receivedArgs: args,
            message: `Simulated execution of ${method.toUpperCase()} ${pathKey}`
          })
        };

        tools.push(tool);
      });
    });

    if (tools.length === 0) {
      warnings.push('No REST path operations (GET, POST, etc.) found in the spec.');
    }

    return {
      success: true,
      tools,
      apiTitle,
      apiVersion,
      serverUrl,
      warnings
    };
  } catch (err: any) {
    return {
      success: false,
      tools: [],
      error: err.message || 'Failed to parse OpenAPI/Swagger spec',
      warnings
    };
  }
}
