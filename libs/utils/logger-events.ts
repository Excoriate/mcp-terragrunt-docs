import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class McpNotificationLogger {
  // The server instance
  private server: Server;

  constructor(mcpServer: McpServer) {
    this.server = mcpServer.server;
  }

  sendDebugLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "debug",
      data,
    });
  }

  sendInfoLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "info",
      data,
    });
  }

  sendNoticeLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "notice",
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

  sendCriticalLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "critical",
      data,
    });
  }

  sendAlertLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "alert",
      data,
    });
  }

  sendEmergencyLogMessage(data?: Record<string, unknown>): void {
    this.server.sendLoggingMessage({
      level: "emergency",
      data,
    });
  }
}