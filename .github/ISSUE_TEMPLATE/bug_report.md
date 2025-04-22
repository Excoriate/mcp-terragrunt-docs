---
name: 🐞 Bug Report
about: Create a detailed bug report to help improve the MCP Server
title: "bug: "
labels: ["bug"]
assignees: ["Excoriate"] # Adjust if needed
---

## 🔍 Bug Description

> [!WARNING]
> Provide a clear and concise description of the bug you encountered with the
> MCP server.

### Expected Behavior

> [!NOTE]
> Describe what you expected to happen:
>
> - What was the intended outcome when interacting with the server?
> - How should the server have responded or behaved?

### Actual Behavior

> [!IMPORTANT]
> Describe what actually happened:
>
> - What went wrong?
> - What unexpected results, errors, or responses did you observe?

## 🔬 Steps to Reproduce

> [!TIP]
> Provide detailed steps to reproduce the bug:

1. Start the server using `deno task dev` or relevant command...
2. Connect using MCP client '....' (e.g., Claude Desktop, MCP Inspector)
3. Send request / Perform action '....'
4. Observe the error/unexpected behavior '....'

### Minimal Reproducible Example

> [!WARNING]
> If applicable, include a minimal code snippet (TypeScript) or configuration
> that demonstrates the issue:

```typescript
// Your minimal reproducible TypeScript code snippet (if applicable)
// or relevant configuration details
```

## 🌍 Environment Details

> [!IMPORTANT]
> Provide context about your environment:

- **Deno Version**: (e.g., `deno --version`)
- **MCP SDK Version**: (from `deno.lock` or `deno.json`, e.g.,
  `npm:@modelcontextprotocol/sdk@1.8.0`)
- **Operating System**: (e.g., macOS Sonoma 14.1, Windows 11, Ubuntu 22.04)
- **MCP Client Used**: (e.g., Claude Desktop vX.Y.Z, MCP Inspector, Custom
  Client)
- **Relevant `deno.json` / `deno.lock` sections**: (if applicable)

## 📋 Diagnostic Information

> [!TIP]
> Include any relevant diagnostic information:

- Full error messages from the server console
- Full error messages or unexpected responses from the MCP client
- Screenshots of the error or unexpected behavior
- Relevant logs (please ensure no sensitive data is included)

## 🖼️ Additional Context

> [!NOTE]
> Add any other context about the problem:
>
> - When did you first notice this issue?
> - Does it happen consistently or intermittently?
> - Any recent changes (e.g., dependency updates, code changes) that might have
>   introduced the bug?

### Checklist

- [ ] I've checked existing issues for duplicates
- [ ] I've provided a clear description of the bug
- [ ] I've included steps to reproduce
- [ ] I've shared relevant environment details
- [ ] I've added diagnostic information (if applicable)

**Thank you for helping improve the `mcp-terragrunt-docs` server!** 🐛
