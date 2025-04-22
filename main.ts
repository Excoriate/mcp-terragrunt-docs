import "jsr:@std/dotenv@0.225.3/load";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  type CallToolRequest,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type Resource,
} from "@modelcontextprotocol/sdk/types.js";
import { TerragruntDocs } from "./libs/services/terragrunt-docs.ts";
import { McpNotificationLogger } from "./libs/utils/logger-events.ts";
import {
  TOOLS_GET_ALL_DOCS_BY_CATEGORY_ARGS_SCHEMA,
  TOOLS_LIST_ALL_DOCS_BY_CATEGORY,
  TOOLS_LIST_DOC_CATEGORIES,
  TOOLS_READ_DOCUMENT_FROM_CATEGORY,
  TOOLS_READ_DOCUMENT_FROM_CATEGORY_ARGS_SCHEMA,
  TOOLS_READ_ALL_DOCS_FROM_CATEGORY,
  TOOLS_READ_ALL_DOCS_FROM_CATEGORY_ARGS_SCHEMA,
  TOOLS_GET_ALL_OPEN_ISSUES,
  TOOLS_GET_ALL_OPEN_ISSUES_ARGS_SCHEMA,
  GitHubTokenSchema,
} from "./libs/mcp/tools.ts";
import { TerragruntIssues, type GitHubIssue } from "./libs/services/terragrunt-issues.ts";
import type { z } from "zod";

const MCP_SERVER_NAME = "mcp-terragrunt-docs";
const MCP_SERVER_VERSION = "0.0.1";

/**
 * Retrieves and validates a GitHub token from environment variables.
 *
 * @description
 * This function attempts to get a GitHub token from one of the following environment variables:
 * - GITHUB_TOKEN
 * - GH_TOKEN
 * - GITHUB_PERSONAL_ACCESS_TOKEN
 *
 * The token is then validated against the GitHubTokenSchema to ensure it meets the required format.
 *
 * @throws {Error} If no token is found in the environment variables
 * @throws {Error} If the token fails validation against GitHubTokenSchema
 *
 * @returns {string} The validated GitHub token
 */
function getAndValidateGithubToken(): string {
  const token = Deno.env.get("GITHUB_TOKEN") || Deno.env.get("GH_TOKEN") || Deno.env.get("GITHUB_PERSONAL_ACCESS_TOKEN");
  if (!token) {
    throw new Error("GitHub token is not set in the environment (GITHUB_TOKEN or GH_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN)");
  }
  const result = GitHubTokenSchema.safeParse({ githubToken: token });
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return token;
}

// Server definition
const server = new Server(
  {
    name: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
  },
  {
    capabilities: {
      logging: { enabled: true },
      tools: { enabled: true },
      resources: { enabled: true },
    },
  },
);

// Logger (MCP Notification Logger)
const mcpLogger = new McpNotificationLogger(server);

// Resource definition
const TERRAGRUNT_REPO_RESOURCE: Resource = {
  name: "terragrunt-repo",
  uri: "config://repo",
  text: "https://github.com/gruntwork-io/terragrunt",
  mimeType: "text/plain",
};

server.setRequestHandler(ListResourcesRequestSchema, () => ({
  resources: [TERRAGRUNT_REPO_RESOURCE],
}));

server.setRequestHandler(
  ReadResourceRequestSchema,
  (request) => {
    if (request.params.uri === TERRAGRUNT_REPO_RESOURCE.uri) {
      return {
        contents: [TERRAGRUNT_REPO_RESOURCE],
      };
    }

    throw new Error("Resource not found");
  },
);

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [
    TOOLS_LIST_DOC_CATEGORIES,
    TOOLS_LIST_ALL_DOCS_BY_CATEGORY,
    TOOLS_READ_DOCUMENT_FROM_CATEGORY,
    TOOLS_READ_ALL_DOCS_FROM_CATEGORY,
    TOOLS_GET_ALL_OPEN_ISSUES,
  ],
}));

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    const toolNameParam = request.params.name;
    const toolArgs = request.params.arguments;

    let ghTokenFromEnv: string;

    try {
      ghTokenFromEnv = getAndValidateGithubToken();
    } catch (error: unknown) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error handling ${toolNameParam}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }

    switch (toolNameParam) {
      // List doc categories
      case TOOLS_LIST_DOC_CATEGORIES.name:
        try {
          // No input validation needed (no args)
          const tgServer = new TerragruntDocs({
            token: ghTokenFromEnv,
          });

          const categories = await tgServer.getDocCategories();

          return {
            content: categories.map((category) => ({
              type: "text" as const,
              text: `${category.name}: ${category.html_url}`,
            })),
          };
        } catch (error: unknown) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Error handling ${TOOLS_LIST_DOC_CATEGORIES.name}: ${error}`,
              },
            ],
          };
        }

      // List all docs by category
      case TOOLS_LIST_ALL_DOCS_BY_CATEGORY.name:
        try {
          const result = TOOLS_GET_ALL_DOCS_BY_CATEGORY_ARGS_SCHEMA.safeParse(
            toolArgs,
          );

          if (!result.success) {
            throw new Error(result.error.message);
          }

          const validatedArgs = result.data;

          const tgServer = new TerragruntDocs({
            token: ghTokenFromEnv,
          });

          const docs = await tgServer.listDocumentsInCategory(
            validatedArgs.category,
          );

          return {
            content: docs.map((doc) => ({
              type: "text" as const,
              text: `${doc.name}: ${doc.html_url}`,
            })),
          };
        } catch (error: unknown) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Error handling ${TOOLS_LIST_ALL_DOCS_BY_CATEGORY.name}: ${error}`,
              },
            ],
          };
        }
        // Read all docs from a category
        case TOOLS_READ_ALL_DOCS_FROM_CATEGORY.name:
          try {
            const result = TOOLS_READ_ALL_DOCS_FROM_CATEGORY_ARGS_SCHEMA.safeParse(
              toolArgs,
            );

            if (!result.success) {
              throw new Error(result.error.message);
            }

            const validatedArgs = result.data;

            const tgServer = new TerragruntDocs({
              token: ghTokenFromEnv,
            });

            const docs = await tgServer.getAllDocumentsMergedFromCategory(
              validatedArgs.category,
            );

            return {
              content: [
                {
                  type: "text" as const,
                  text: docs,
                },
              ],
            };
          } catch (error: unknown) {
            return {
              content: [
                {
                  type: "text" as const,
                  text:
                    `Error handling ${TOOLS_READ_ALL_DOCS_FROM_CATEGORY.name}: ${error}`,
                },
              ],
            };
          }
		// Get document from category
		case TOOLS_READ_DOCUMENT_FROM_CATEGORY.name:
			try {
				const result = TOOLS_READ_DOCUMENT_FROM_CATEGORY_ARGS_SCHEMA.safeParse(toolArgs);

				if (!result.success) {
				  throw new Error(result.error.message);
				}

				const validatedArgs = result.data;

				const tgServer = new TerragruntDocs({
				  token: ghTokenFromEnv,
				});

          const document = await tgServer.getDocumentFromCategory({
            category: validatedArgs.category,
            document: validatedArgs.document,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: document.content,
              },
            ],
				};
			  } catch (error: unknown) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error handling ${TOOLS_READ_DOCUMENT_FROM_CATEGORY.name}: ${error}`,
					},
				  ],
				};
			  }
        // Get all open issues
        case TOOLS_GET_ALL_OPEN_ISSUES.name: {
          try {
            const result = TOOLS_GET_ALL_OPEN_ISSUES_ARGS_SCHEMA.safeParse(toolArgs);
            if (!result.success) {
              throw new Error(result.error.message);
            }

            const validatedArgs: z.infer<typeof TOOLS_GET_ALL_OPEN_ISSUES_ARGS_SCHEMA> = result.data;
            const tgServer = new TerragruntIssues({
              token: ghTokenFromEnv,
            });

            let issues: GitHubIssue[] = [];
            if (validatedArgs.all) {
              issues = await tgServer.getAllOpenIssues();
            } else {
              issues = await tgServer.getOpenIssues();
            }

            const formatted = issues.map((issue) => `#${issue.number}: ${issue.title}`).join("\n");
            return {
              content: [
                {
                  type: "text" as const,
                  text: formatted.length > 0 ? formatted : "No open issues found.",
                },
              ],
            };
          } catch (error: unknown) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error handling ${TOOLS_GET_ALL_OPEN_ISSUES.name}: ${error instanceof Error ? error.message : String(error)}`,
                },
              ],
            };
          }
        }
      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${toolNameParam}`,
            },
          ],
        };
    }
  },
);

const transport = new StdioServerTransport();

try {
  await server.connect(transport);

  mcpLogger.sendInfoLogMessage({
    message: "Server initialized",
  });

  mcpLogger.sendInfoLogMessage({
    message: "MCP server successfully connected and ready",
  });

  mcpLogger.sendInfoLogMessage({
    message: "Server setup complete",
  });
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Failed to connect server: ${errorMessage}`);

  throw error;
}

globalThis.addEventListener("error", (event) => {
  console.error(`Uncaught error: ${event.error?.message || event.message}`);
});
