# MCP Server: Terragrunt Docs Provider

[![Language](https://img.shields.io/badge/language-Deno/TypeScript-blue.svg)](https://deno.land/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) <!-- Assuming MIT, add LICENSE file if needed -->

A [Model Context Protocol (MCP)](modelcontextprotocol.io) server built with Deno and TypeScript, designed to provide contextual information related to [Terragrunt](https://terragrunt.gruntwork.io/).

## Overview

This server acts as an MCP provider, exposing tools and resources that allow AI agents or other MCP clients to query information about Terragrunt documentation and development information, such as GitHub issues.

- Watch a realistic demo 📺 on Claude Desktop [here](https://screen.studio/share/UKJNhBNq)

---

## Why?

When writing IaC configurations, mostly in terragrunt, the IDE support isn't that good, in VSCode the terraform plugin is good, but not for terragrunt; it does not recognize the terragrunt blocks and does not provide any autocompletion. When interacting with AI autocompletion, it's common to get incorrect results, or false-positive linting errors. With this MCP server, you can provide to your LLM/AI assistant the latest documentation and issues from the Terragrunt GitHub repository, so it can use that to provide you with the most accurate information.

## Tools

> **Note:** All tools require a valid GitHub token set as an environment variable: `GITHUB_TOKEN`, `GH_TOKEN`, or `GITHUB_PERSONAL_ACCESS_TOKEN`.

| Tool Name                   | Purpose                                                                 | Inputs                                   | Outputs                                                                 | Use Case                                                                                          |
|-----------------------------|-------------------------------------------------------------------------|------------------------------------------|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `list-doc-categories`       | Retrieve all documentation categories from Terragrunt docs.             | None                                     | Array of objects with `name` (string) and `link` (string) properties    | Use when you need to explore the available documentation structure or when building a documentation navigation system. This is typically the first tool to call when starting to work with Terragrunt docs. |
| `list-all-docs-by-category` | List all docs in a specific category.                                   | category (string)                        | Array of objects with `name` (string), `link` (string), and `content` (string) | Use when you need to see all available documentation within a specific category, such as when building a category-specific documentation viewer or when you need to scan through all docs in a particular area. |
| `read-document-from-category` | Read a specific doc from a category.                                    | category (string), document (string)     | Object containing `content` (string) with the full markdown content     | Use when you need to access the complete content of a specific document, such as when implementing documentation search or when you need to reference specific documentation in your application. |
| `read-all-docs-from-category` | Retrieve and merge all docs in a category into one response.            | category (string)                        | Object containing `content` (string) with all docs merged into one      | Use when you need a comprehensive view of all documentation within a category, such as when building a documentation search feature or when you need to analyze the complete documentation set for a specific topic. |
| `get-all-open-issues`         | Retrieve all open issues from Terragrunt GitHub repo.                   | all (boolean, optional)                  | Array of objects with `title` (string), `number` (number), `state` (string), `created_at` (string), `updated_at` (string), `body` (string), and `labels` (string[]) | Use when you need to track or analyze current issues in the Terragrunt project, such as when building an issue dashboard, performing issue triage, or when you need to stay updated with the latest project challenges and discussions. |

## Setup

1. **Install Deno:**
   - [Deno Installation Guide](https://deno.land/manual/getting_started/installation)
2. **Clone the repository:**

   ```sh
   git clone https://github.com/Excoriate/mcp-terragrunt-docs.git
   cd mcp-terragrunt-docs
   ```

3. **Set your GitHub token as an environment variable:**
   - On Unix/macOS:

     ```sh
     export GITHUB_TOKEN=ghp_xxx... # or GH_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN
     ```
   - On Windows (cmd):

     ```cmd
     set GITHUB_TOKEN=ghp_xxx...
     ```
>Note: You can also set the token in the `.env` file.

4. **Run the MCP server:**

   ```sh
   # directly using deno
   deno run -A main.ts

   # Using the justfile
   just run

   # You can also debug it, and inspect it locally
   just inspect
   ```
The most straightforward method is to use it directly from [JSR](https://jsr.io/) (Javascript Registry ❤️)
```sh
# export your github token
export GITHUB_TOKEN=ghp_xxx...

# run it
deno run -A jsr:@excoriate/mcp-terragrunt-docs@0.1.0
```

### Usage with Claude Desktop
To use this Deno-based MCP server with Claude Desktop, add the following to your `claude_desktop_config.json`:

#### Using Deno

```json
{
  "mcpServers": {
    "terragrunt_docs": {
      "command": "deno",
      "args": [
        "run",
        "-A",
        "main.ts"
      ],
      "env": {
        "GITHUB_TOKEN": "<YOUR_TOKEN>"
      },
    }
  }
}
```

#### Using Docker

```json
{
  "mcpServers": {
    "terragrunt_docs": {
      "command": "docker",
      "args": [
        "run",
        "-e", "GITHUB_TOKEN=<YOUR_TOKEN>", "mcp-terragrunt-docs"
      ],
      "env": {
        "GITHUB_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

#### Using JSR

```json
{
  "mcpServers": {
    "terragrunt_docs": {
      "command": "deno",
      "args": [
        "run",
        "-A",
        "jsr:@excoriate/mcp-terragrunt-docs@0.1.0"
      ],
      "env": {
        "GITHUB_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

### Build the Docker image

```sh
docker build -t mcp-terragrunt-docs .
```

### Run the MCP server in Docker

```sh
docker run -it --rm \
  -e GITHUB_TOKEN=ghp_xxx... \
  mcp-terragrunt-docs
```

- Replace `ghp_xxx...` with your [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with appropriate permissions.
- You can also use `GH_TOKEN` or `GITHUB_PERSONAL_ACCESS_TOKEN` as the environment variable name.
- If you want to use a local `.env` file, you can pass it with `--env-file .env`.

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed contribution guidelines, including setup, code style, PR process, and codebase structure reference.

## Security

See [SECURITY.md](SECURITY.md) for the project's security policy, including how to report vulnerabilities and responsible disclosure guidelines.

## License

This project is licensed under the [MIT License](LICENSE).
