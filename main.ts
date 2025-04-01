import "jsr:@std/dotenv/load";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import logger from "./libs/logger.ts";

// import {
//   ListPromptsRequestSchema,
//   GetPromptRequestSchema
// } from "@modelcontextprotocol/sdk/types.js";

logger.info("Initializing MCP server for terragrunt-docs");

const server = new Server(
  {
    name: "mcp-terragrunt-docs",
    version: "0.0.1"
  },
  {
    capabilities: {
      prompts: {}
    }
  }
);

const transport = new StdioServerTransport();
logger.debug("Created StdioServerTransport for server communication");

try {
  logger.info("Connecting server to transport");
  await server.connect(transport);
  logger.info("MCP server successfully connected and ready");
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Failed to connect server: ${errorMessage}`);
  throw error;
}

// Log uncaught errors
globalThis.addEventListener("error", (event) => {
  logger.error(`Uncaught error: ${event.error?.message || event.message}`);
});

logger.debug("Server setup complete");