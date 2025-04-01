import "jsr:@std/dotenv/load";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpNotificationLogger } from "./libs/utils/logger-events.ts";
import { TerragruntDocs } from "./libs/services/terragrunt-docs.ts";
import { z } from "zod";

const server = new McpServer(
  {
    name: "mcp-terragrunt-docs",
    version: "0.0.1"
  },
  {
    capabilities: {
      logging: { enabled: true }
    }
  }
);

const mcpLogger = new McpNotificationLogger(server);

// Properly format resources to match MCP SDK requirements
server.resource(
  "config",
  "config://token",
  () => {
    const token = Deno.env.get("GITHUB_TOKEN") || "";
    return {
      contents: [
        {
          uri: "config://token",
          text: token,
          mimeType: "text/plain"
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
          text: "https://github.com/gruntwork-io/terragrunt",
          mimeType: "text/plain"
        }
      ]
    };
  }
);

server.tool(
  "tg-docs-categories",
  "Get all the categories of documentation that Terragrunt has documented on their official website https://terragrunt.gruntwork.io/docs/",
  {
    githubToken: z.string().describe("The GitHub token to use to fetch the documentation")
  },
  async ({ githubToken }) => {
    const tgServer = new TerragruntDocs({
      token: githubToken
    });

    const categories = await tgServer.getDocCategories();
    
    return {
      content: categories.map(category => ({
        type: "text" as const,
        text: `${category.name}: ${category.html_url}`
      }))
    };
  }
);

server.tool(
  "tg-get-doc-by-category",
  "Get a specific document from a category of documentation that Terragrunt has documented on their official website https://terragrunt.gruntwork.io/docs/",
  {
    category: z.string().describe("The category of documentation to get the document from"),
    document: z.string().describe("The document to get from the category"),
    githubToken: z.string().describe("The GitHub token to use to fetch the documentation")
  },
  async ({ category, document, githubToken }) => {
    const tgServer = new TerragruntDocs({
      token: githubToken
    });

    const doc = await tgServer.getDocumentFromCategory({
      category,
      document
    });

    return {
      content: [
        {
          type: "text" as const,
          text: doc.content
        }
      ]
    };
  }
);

server.tool(
  "tg-get-all-docs-by-category",
  "Get all documents from a category of documentation that Terragrunt has documented on their official website https://terragrunt.gruntwork.io/docs/. Returns all documents merged into a single text.",
  {
    category: z.string().describe("The category of documentation to get all documents from"),
    githubToken: z.string().describe("The GitHub token to use to fetch the documentation")
  },
  async ({ category, githubToken }) => {
    const tgServer = new TerragruntDocs({
      token: githubToken
    });

    const allDocsContent = await tgServer.getAllDocumentsByCategory(category);

    return {
      content: [
        {
          type: "text" as const,
          text: allDocsContent
        }
      ]
    };
  }
);

const transport = new StdioServerTransport();

try {
  // Connect the server to the transport before using the logger
  await server.connect(transport);
  
  // Now that the server is connected, we can use the logger
  mcpLogger.sendInfoLogMessage({
    message: "Server initialized"
  });
  
  mcpLogger.sendInfoLogMessage({
    message: "MCP server successfully connected and ready"
  });
  
  mcpLogger.sendInfoLogMessage({
    message: "Server setup complete"
  });
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Failed to connect server: ${errorMessage}`);

  throw error;
}

// Log uncaught errors
globalThis.addEventListener("error", (event) => {
  // Only use the logger if the server is connected
  console.error(`Uncaught error: ${event.error?.message || event.message}`);
});
