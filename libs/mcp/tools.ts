import { z } from "zod";

// Base schema for GitHub Token validation - reusable for env var validation only
const GitHubTokenSchema = z.object({
  githubToken: z
    .string({
      required_error:
        "A valid GitHub token is required for authenticating and accessing the documentation data.",
      invalid_type_error: "The GitHub token must be a string.",
    })
    .min(1, {
      message: "The GitHub token must not be empty.",
    })
    .regex(/^(gh[a-z]_[A-Za-z0-9_]{16,})$|^[a-f0-9]{40}$/, {
      message: "The GitHub token must be a valid GitHub Personal Access Token.",
    })
    .describe(
      "A valid GitHub token required for authenticating and accessing the documentation data.",
    ),
});

// Export for env var validation only
export { GitHubTokenSchema };

// Base schema for category validation
const CategorySchema = z.object({
  category: z
    .string({
      required_error:
      "The category of documentation to get the document from is required (e.g. 'cli', 'reference', 'configuration', 'community', 'troubleshooting', etc.).",
      invalid_type_error: "The category must be a string.",
    })
    .min(1, {
      message: "The category must not be empty.",
    })
    .describe("The category of documentation to get the document from"),
});

const DocumentSchema = z.object({
  document: z.string({
    required_error: "The documentation file to read is required (e.g. 'getting-started', 'experiments', 'logging', 'cli-options', etc.).",
    invalid_type_error: "The documentation file must be a string.",
  })
  .min(1, {
    message: "The documentation file is required, it must not be empty.",
  })
  .describe("The documentation file to read"),
});

// Tool input schemas (no githubToken)
export const TOOLS_GET_ALL_DOCS_BY_CATEGORY_ARGS_SCHEMA = CategorySchema;
export const TOOLS_READ_DOCUMENT_FROM_CATEGORY_ARGS_SCHEMA = CategorySchema.extend(DocumentSchema.shape);
export const TOOLS_READ_ALL_DOCS_FROM_CATEGORY_ARGS_SCHEMA = CategorySchema;
export const TOOLS_GET_ALL_OPEN_ISSUES_ARGS_SCHEMA = z.object({
  all: z.boolean().optional(),
});

// Tool: list-doc-categories
export const TOOLS_LIST_DOC_CATEGORIES = {
  name: "list-doc-categories",
  description:
    `Use this tool to retrieve a complete, up-to-date list of all documentation categories available in the official Terragrunt documentation. This is the FIRST STEP for any workflow where you do not already know the category name required by other tools. 

**When to use:**
- When you need to discover what documentation categories exist before selecting or reading documents.
- As a prerequisite for 'list-all-docs-by-category', 'read-document-from-category', or 'read-all-docs-from-category' if the category is unknown or user input is ambiguous.

**How to chain:**
- If the user requests a document or overview but does not specify a category, call this tool first, then present or select from the results before proceeding.
- If a tool returns an error about an unknown category, use this tool to recover.

**Inputs:**
- None (GitHub token is now sourced from environment variable).

**Outputs:**
- Structured list of all available documentation categories, each with a name and link.

**Related tools:**
- 'list-all-docs-by-category' (to list docs in a category)
- 'read-document-from-category' (to read a specific doc)
- 'read-all-docs-from-category' (to merge all docs in a category)

**Example workflow:**
1. Call 'list-doc-categories' to get categories.
2. Use 'list-all-docs-by-category' with a selected category.
3. Use 'read-document-from-category' or 'read-all-docs-from-category' as needed.
`,
  inputSchema: {
    type: "object",
    properties: {},
  },
};

// Tool: get-all-docs-by-category
export const TOOLS_LIST_ALL_DOCS_BY_CATEGORY = {
  name: "list-all-docs-by-category",
  description:
    `Use this tool to retrieve a list of all documentation files within a specific category. This is the SECOND STEP after discovering categories with 'list-doc-categories' if you do not already know the document name. 

**When to use:**
- When you know the category but not the document name, or need to present all available docs in a category.
- As a prerequisite for 'read-document-from-category' or 'read-all-docs-from-category' if the document name is unknown.

**How to chain:**
- If the user requests a document but only specifies a category, call this tool to list available docs, then select the appropriate document for reading.
- If a tool returns an error about an unknown document, use this tool to recover.

**Inputs:**
- category (required): Use a value from 'list-doc-categories'.

**Outputs:**
- Structured list of all documentation files in the specified category.

**Related tools:**
- 'list-doc-categories' (to discover categories)
- 'read-document-from-category' (to read a specific doc)
- 'read-all-docs-from-category' (to merge all docs in a category)

**Example workflow:**
1. Call 'list-doc-categories' if category is unknown.
2. Call 'list-all-docs-by-category' with the chosen category.
3. Use 'read-document-from-category' or 'read-all-docs-from-category' as needed.
`,
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "The category of documentation to get the document from",
      },
    },
    required: ["category"],
  },
};

export const TOOLS_READ_DOCUMENT_FROM_CATEGORY = {
  name: "read-document-from-category",
  description:
    `Use this tool to retrieve and read a specific documentation file from a specific category. This is the FINAL STEP when you know both the category and document name. 

**When to use:**
- When you know both the category and document name (from user input or previous tool calls).
- To access detailed information about a specific Terragrunt feature, command, or concept.

**How to chain:**
- If the user request is ambiguous or missing category/document, use 'list-doc-categories' and/or 'list-all-docs-by-category' first.
- If this tool returns an error about missing/invalid category or document, fallback to discovery tools.

**Inputs:**
- category (required): Use a value from 'list-doc-categories'.
- document (required): Use a value from 'list-all-docs-by-category'.

**Outputs:**
- The full content of the specified documentation file.

**Related tools:**
- 'list-doc-categories' (to discover categories)
- 'list-all-docs-by-category' (to discover docs in a category)
- 'read-all-docs-from-category' (to merge all docs in a category)

**Example workflow:**
1. If category or document is unknown, call discovery tools in order.
2. Call 'read-document-from-category' with both values.
`,
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "The category of documentation to get the document from",
      },
      document: {
        type: "string",
        description: "The documentation file to read",
      },
    },
    required: ["category", "document"],
  },
};

export const TOOLS_READ_ALL_DOCS_FROM_CATEGORY = {  
  name: "read-all-docs-from-category",
  description: `Use this tool to retrieve and merge all documentation files from a specific category into a single, comprehensive response. This is ideal for overviews, summaries, or when the user requests "everything" in a category. 

**When to use:**
- When the user requests a full overview, merged summary, or all docs in a category.
- When you want to provide a unified document containing all markdown files in a category.

**How to chain:**
- If the category is unknown, use 'list-doc-categories' first.
- If the category is empty or an error occurs, inform the user and suggest using discovery tools.

**Inputs:**
- category (required): Use a value from 'list-doc-categories'.

**Outputs:**
- A single merged document, with each file's content clearly separated and labeled. If the category is empty, a message indicating no documents were found.

**Related tools:**
- 'list-doc-categories' (to discover categories)
- 'list-all-docs-by-category' (to discover docs in a category)
- 'read-document-from-category' (to read a specific doc)

**Example workflow:**
1. Call 'list-doc-categories' if category is unknown.
2. Call 'read-all-docs-from-category' with the chosen category.
`,
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "The category of documentation to get the document from",
      },
    },
    required: ["category"],
  },
};

export const TOOLS_GET_ALL_OPEN_ISSUES = {
  name: "get-all-open-issues",
  description: `Use this tool to retrieve all open issues from the official Terragrunt GitHub repository. This tool is essential for tracking bugs, feature requests, and ongoing work. 

**When to use:**
- When you need to fetch the complete list of open issues for triage, reporting, or analysis.
- When you want to monitor the current state of the Terragrunt issue tracker.
- For building dashboards, reports, or integrations that require up-to-date issue data.

**How to chain:**
- If you need to correlate issues with documentation, use the documentation tools in combination.

**Inputs:**
- all (optional): Whether to retrieve all open issues or just the first 30.

**Outputs:**
- List of open issues with detailed metadata (ID, title, state, URL, labels, author, timestamps, etc.).

**Related tools:**
- Documentation tools (to correlate issues with docs)

**Example workflow:**
1. Call 'get-all-open-issues' with or without the 'all' flag.
2. Present or process the returned issues as needed.
`,
  inputSchema: {
    type: "object",
    properties: {
      all: {
        type: "boolean",
        description: "Whether to retrieve all open issues or not",
      },
    },
  },
};
