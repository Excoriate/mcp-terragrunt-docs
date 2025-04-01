import {
  Logger,
  ConsoleHandler,
  FileHandler,
} from "https://deno.land/std/log/mod.ts"; // Use latest version
import type {
  LogRecord,
  LevelName,
  BaseHandler,
  BaseHandlerOptions,
  FileHandlerOptions
} from "https://deno.land/std/log/mod.ts";

// Helper function to safely get log level from environment variable
function getLogLevel(envVar: string, defaultValue: LevelName): LevelName {
    const levelStr = Deno.env.get(envVar)?.toUpperCase() as LevelName | undefined;
    
    // Valid level names
    const validLevels: LevelName[] = ['NOTSET', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    
    if (levelStr && validLevels.includes(levelStr)) {
        return levelStr;
    }

    const envValue = Deno.env.get(envVar);
    if (envValue !== undefined && (levelStr === undefined || !validLevels.includes(levelStr))) {
         console.warn(
            `Invalid log level specified for ${envVar}: "${envValue}". Defaulting to ${defaultValue}.`,
         );
    } else if (envValue === undefined) {
         // console.info(`${envVar} not set, defaulting to ${defaultValue}`);
    }

    return defaultValue;
}

// --- Configuration from Environment Variables ---
const consoleLogLevel: LevelName = getLogLevel("LOG_LEVEL", "INFO");
const logFileEnabled: boolean = Deno.env.get("LOG_FILE_ENABLED")?.toLowerCase() === "true";
const logFilePath: string = Deno.env.get("LOG_FILE_PATH") || "./app.log";
const fileLogLevel: LevelName = getLogLevel("LOG_FILE_LEVEL", "DEBUG");

// --- Logger Setup ---

// Create console handler first
// Constructor: new ConsoleHandler(levelName: LevelName, options?: BaseHandlerOptions)
const consoleHandlerOptions: BaseHandlerOptions = {
    formatter: (logRecord: LogRecord) => `[${logRecord.levelName}] ${logRecord.datetime.toISOString()} - ${logRecord.msg}`
};
const consoleHandler = new ConsoleHandler(consoleLogLevel, consoleHandlerOptions);

// Prepare list of handlers, starting with console
const activeHandlers: BaseHandler[] = [consoleHandler];

// Conditionally create and add file handler
if (logFileEnabled) {
  try {
    // Constructor: new FileHandler(levelName: LevelName, options: FileHandlerOptions)
    const fileHandlerOptions: FileHandlerOptions = {
      filename: logFilePath,
      formatter: (logRecord: LogRecord) => JSON.stringify({
          timestamp: logRecord.datetime,
          level: logRecord.levelName,
          logger: logRecord.loggerName,
          message: logRecord.msg,
          // args: logRecord.args
      }),
      // mode: 'a', // append mode is default
    };
    const fileHandler = new FileHandler(fileLogLevel, fileHandlerOptions);
    activeHandlers.push(fileHandler);
    console.info(`File logging enabled: level=${fileLogLevel}, path=${logFilePath}`);
  } catch (error) {
    console.error(`Failed to initialize file logger at path "${logFilePath}":`, error);
    console.error("File logging will be disabled.");
  }
} else {
    console.info("File logging is disabled.");
}

// Create logger instance with all active handlers
// The Logger constructor has changed in newer versions:
// new Logger(loggerName: string, levelName?: LevelName, options?: LoggerOptions)
// where options can include handlers: BaseHandler[]
const logger = new Logger("default", "NOTSET", { handlers: activeHandlers });

// Export the configured logger instance
export default logger;
