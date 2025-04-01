import "jsr:@std/dotenv/load";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpNotificationLogger } from "./libs/utils/logger-events.ts";

// import {
//   ListPromptsRequestSchema,
//   GetPromptRequestSchema
// } from "@modelcontextprotocol/sdk/types.js";


const server = new McpServer(
  {
    name: "mcp-terragrunt-docs",
    version: "0.0.1"
  }
);

const mcpLogger = new McpNotificationLogger(server);

// Register the MCP logger first thing after creating the server
mcpLogger.sendInfoLogMessage({
  message: "Server initialized"
});

// Properly format resources to match MCP SDK requirements
server.resource(
  "config",
  "config://token",
  () => {
    return {
      contents: [
        {
          uri: "config://token",
          text: JSON.stringify({
            githubToken: Deno.env.get("GITHUB_TOKEN")
          }),
          mimeType: "application/json"
        }
      ]
    };
  }
);

server.resource(
  "config",
  "config://repo",
  () => {
    return {
      contents: [
        {
          uri: "config://repo",
          text: JSON.stringify({
            repo: "https://github.com/gruntwork-io/terragrunt"
          }),
          mimeType: "application/json"
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();
mcpLogger.sendDebugLogMessage({
  message: "Created StdioServerTransport for server communication"
});

try {
  mcpLogger.sendInfoLogMessage({
    message: "Connecting server to transport"
  });

  await server.connect(transport);

  mcpLogger.sendInfoLogMessage({
    message: "MCP server successfully connected and ready"
  });
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  mcpLogger.sendErrorLogMessage({
    message: `Failed to connect server: ${errorMessage}`
  });

  throw error;
}

// Log uncaught errors
globalThis.addEventListener("error", (event) => {
  mcpLogger.sendErrorLogMessage({
    message: `Uncaught error: ${event.error?.message || event.message}`
  });
});

mcpLogger.sendInfoLogMessage({
  message: "Server setup complete"
});
