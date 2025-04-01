# mcp-terragrunt-docs

Deno/TypeScript MCP Server providing context related to Terragrunt documentation.

## Configuration

### Logger

The application uses a configurable logger implemented in `libs/logger.ts`. Logging behavior can be controlled via the following environment variables (defined in `.env` for local development):

*   `LOG_LEVEL`: Sets the minimum log level for **console output**.
    *   Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
    *   Default: `INFO`
*   `LOG_FILE_ENABLED`: Enables or disables logging to a file.
    *   Options: `true`, `false`
    *   Default: `false`
*   `LOG_FILE_PATH`: Specifies the path for the log file (only used if `LOG_FILE_ENABLED=true`).
    *   Default: `./app.log`
*   `LOG_FILE_LEVEL`: Sets the minimum log level for **file output** (only used if `LOG_FILE_ENABLED=true`).
    *   Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
    *   Default: `DEBUG`

See `.env.example` for a template.

## Development

Use the `justfile` for common tasks:

*   `just run` or `just serve`: Start the development server with watch mode.
*   `just test`: Run tests.
*   `just lint`: Run the linter.
*   `just fmt`: Format the code.

*(Add more sections about setup, usage, etc. as needed)*
