# Contributing to MCP Terragrunt Context Provider

Thank you for your interest in contributing! This project is a Deno/TypeScript implementation of a Model Context Protocol (MCP) server for Terragrunt documentation and GitHub issue integration. Please follow these guidelines to ensure a smooth contribution process.

## Project Overview
- **Language/Runtime:** Deno (TypeScript)
- **Purpose:** Provide contextual Terragrunt documentation and GitHub issue data to AI agents via MCP tools
- **Key Files:**
  - `libs/mcp/tools.ts`: All MCP tool definitions and schemas
  - `README.md`: Project overview and tool table
  - `repomix-output.xml`: Codebase structure and relationship summary
  - `docs/`: Documentation, including this guide

## Environment Setup
1. **Install Deno:**
   - [Deno Installation Guide](https://deno.land/manual/getting_started/installation)
2. **Clone the repository:**
   ```sh
   git clone git@github.com:Excoriate/mcp-terragrunt-docs.git
   cd mcp-terragrunt-docs
   ```
3. **Install dependencies:**
   - Deno handles dependencies via imports; ensure you have internet access for first run.
4. **Run the project:**
   ```sh
   deno run -A main.ts
   ```

## Code Style & Standards
- **Language:** TypeScript (strict mode recommended)
- **Validation:** Use [Zod](https://zod.dev/) for schema validation (see `libs/mcp/tools.ts`)
- **Formatting:**
  - Use [biome](https://biomejs.dev/) or Deno's built-in formatter:
    ```sh
    deno fmt
    ```
  - Consistent 2-space indentation
  - Prefer named exports
- **Comments:**
  - JSDoc for functions and complex logic
  - Inline comments for non-obvious code
- **Linting:**
  - Use Deno lint:
    ```sh
    deno lint
    ```
  - Address all warnings/errors before submitting

## Branching & Pull Request Process
- **Branching:**
  - Use feature branches: `feature/<short-description>`
  - For bugfixes: `fix/<short-description>`
- **Pull Requests:**
  - Reference related issues in the PR description
  - Summarize changes and rationale
  - Ensure all checks pass (lint, test)
  - Request review from maintainers
- **Commit Messages:**
  - Use [Conventional Commits](https://www.conventionalcommits.org/):
    - `feat: add new tool for ...`
    - `fix: correct schema validation for ...`
    - `docs: update README tools table`

## Testing & Verification
- **Testing:**
  - Place tests in the `tests/` directory
  - Use Deno's built-in test runner:
    ```sh
    deno test
    ```
- **Verification:**
  - Ensure new/changed tools are reflected in `README.md` and this guide
  - Cross-reference codebase structure using `repomix-output.xml` for context

## Documentation Updates
- **README.md:**
  - Update the tools table if you add, remove, or change any tool in `libs/mcp/tools.ts`
- **CONTRIBUTING.md:**
  - Update this file if contribution process or standards change

## Codebase Structure Reference
- See `repomix-output.xml` for a merged, searchable summary of all files, components, and their relationships. This is especially useful for onboarding and for understanding cross-file dependencies.

## Styleguide Summary
- TypeScript strict mode
- Zod for all schema validation
- Deno fmt/lint for formatting and style
- JSDoc for documentation
- Feature/bugfix branches, PRs with clear context
- Update documentation with every relevant code change

## Questions or Help?
- Open an issue or discussion in the repository
- Tag maintainers for review or clarification

---

Thank you for helping make this project better! 