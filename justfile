# 🐚 Set the default shell to bash with error handling
set shell := ["bash", "-uce"]

set dotenv-load

# --- Variables ---
# Add any project-specific variables here if needed
MAIN_FILE := "main.ts"
# Permissions needed for running/testing the server (adjust as necessary)
PERMISSIONS := "--allow-read --allow-net --allow-env"

# 📋 Default recipe: List all available commands
default:
    @just --list

# 🚀 Run the development server using the task defined in deno.json
run:
    @echo ">>> Starting development server via 'deno task dev'..."
    deno task dev

# 🔧 Install pre-commit hooks in local environment for code consistency
hooks-install:
    @echo "🧰 Installing pre-commit hooks locally..."
    @./scripts/hooks/pre-commit-init.sh init

# 🕵️ Run pre-commit hooks across all files in local environment
hooks-run:
    @echo "🔍 Running pre-commit hooks from .pre-commit-config.yaml..."
    @./scripts/hooks/pre-commit-init.sh run

# Alias for run
serve: run

# 🕵️ Run the MCP server with the MCP Inspector attached via stdio
inspect:
    @echo ">>> Starting MCP server with Inspector via stdio..."
    @export DENO_ALLOW_ENV=true
    @export DENO_ALLOW_NET=true
    @export DENO_ALLOW_READ=true
    @export MCP_INSPECTOR=true
    @export MCP_DISABLE_CONSOLE=true
    @npx -y @modelcontextprotocol/inspector deno run {{PERMISSIONS}} {{MAIN_FILE}}

# 🧪 Run tests using deno test
test:
    @echo ">>> Running tests using 'deno test'..."
    deno test {{PERMISSIONS}}

# 🧹 Run the Deno linter
lint:
    @echo ">>> Linting code with 'deno lint'..."
    deno lint

# 🎨 Run the Deno formatter
fmt:
    @echo ">>> Formatting code with 'deno fmt'..."
    deno fmt

# 🧹 Clean common build artifacts (customize if needed)
clean:
    @echo ">>> Cleaning common build artifacts..."
    @rm -rf build/ dist/ out/
    @echo "(No Deno-specific cache cleaning by default, as it's usually global)"

# 🐳 Build the Docker image for the MCP server
build-docker:
    @echo ">>> Building Docker image 'mcp-terragrunt-docs'..."
    docker build -t mcp-terragrunt-docs .

# 🐳 Run the MCP server in Docker (pass GITHUB_TOKEN as env var)
# Usage: just run-docker GITHUB_TOKEN=ghp_xxx...
run-docker:
    @echo ">>> Running MCP server in Docker with provided GITHUB_TOKEN..."
    docker run -it --rm -e GITHUB_TOKEN="$GITHUB_TOKEN" mcp-terragrunt-docs
