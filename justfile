# justfile for mcp-terragrunt-docs (Deno/TypeScript)

# 🐚 Set the default shell to bash with error handling
set shell := ["bash", "-uce"]

# --- Variables ---
# Add any project-specific variables here if needed
MAIN_FILE := "main.ts"
# Permissions needed for running/testing the server (adjust as necessary)
PERMISSIONS := "--allow-read --allow-net --allow-env"

# --- Recipes ---

# 📋 List available recipes
default:
    @echo "🦕 Deno MCP Server Recipes 🚀"
    @echo ""
    @echo "--- Development ---"
    @echo "  run / serve    Run the development server with watch mode (uses 'deno task dev')"
    @echo "  test           Run tests using 'deno test'"
    @echo "  lint           Run the Deno linter"
    @echo "  fmt            Run the Deno formatter"
    @echo ""
    @echo "--- Cleanup ---"
    @echo "  clean          Clean common build artifacts (if any)"
    # @just --list # Alternative way to list recipes

# 🚀 Run the development server using the task defined in deno.json
# Assumes 'deno task dev' runs with appropriate permissions and watch flag
run:
    @echo ">>> Starting development server via 'deno task dev'..."
    deno task dev

# Alias for run
serve: run

# 🧪 Run tests using deno test
test:
    @echo ">>> Running tests using 'deno test'..."
    deno test {{PERMISSIONS}}

#  Run the Deno linter
lint:
    @echo ">>> Linting code with 'deno lint'..."
    deno lint

# Run the Deno formatter
fmt:
    @echo ">>> Formatting code with 'deno fmt'..."
    deno fmt

# 🧹 Clean common build artifacts (customize if needed)
clean:
    @echo ">>> Cleaning common build artifacts..."
    @rm -rf build/ dist/ out/
    @echo "(No Deno-specific cache cleaning by default, as it's usually global)"
