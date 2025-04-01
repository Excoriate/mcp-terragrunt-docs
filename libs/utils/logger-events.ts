import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class McpNotificationLogger {
  // The server instance
  private server: Server;

  constructor(mcpServer: McpServer) {
    this.server = mcpServer.server;
  }

  sendInfoLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "info",
      data,
    });
  }

  sendDebugLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "debug",
      data,
    });
  }

  sendWarnLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "warning",
      data,
    });
  }

  sendErrorLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "error",
      data,
    });
  }
}