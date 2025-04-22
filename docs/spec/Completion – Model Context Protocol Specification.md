**Protocol Revision**: 2025-03-26

The Model Context Protocol (MCP) provides a standardized way for servers to
offer argument autocompletion suggestions for prompts and resource URIs. This
enables rich, IDE-like experiences where users receive contextual suggestions
while entering argument values.

## User Interaction Model[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#user-interaction-model)

Completion in MCP is designed to support interactive user experiences similar to
IDE code completion.

For example, applications may show completion suggestions in a dropdown or popup
menu as users type, with the ability to filter and select from available
options.

However, implementations are free to expose completion through any interface
pattern that suits their needs—the protocol itself does not mandate any specific
user interaction model.

## Capabilities[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#capabilities)

Servers that support completions **MUST** declare the `completions` capability:

## Protocol Messages[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#protocol-messages)

### Requesting Completions[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#requesting-completions)

To get completion suggestions, clients send a `completion/complete` request
specifying what is being completed through a reference type:

**Request:**

**Response:**

### Reference Types[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#reference-types)

The protocol supports two types of completion references:

| Type           | Description                 | Example                                             |
| -------------- | --------------------------- | --------------------------------------------------- |
| `ref/prompt`   | References a prompt by name | `{"type": "ref/prompt", "name": "code_review"}`     |
| `ref/resource` | References a resource URI   | `{"type": "ref/resource", "uri": "file:///{path}"}` |

### Completion Results[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#completion-results)

Servers return an array of completion values ranked by relevance, with:

- Maximum 100 items per response
- Optional total number of available matches
- Boolean indicating if additional results exist

## Message Flow[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#message-flow)

## Data Types[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#data-types)

### CompleteRequest[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#completerequest)

- `ref`: A `PromptReference` or `ResourceReference`
- `argument`: Object containing:
  - `name`: Argument name
  - `value`: Current value

### CompleteResult[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#completeresult)

- `completion`: Object containing:
  - `values`: Array of suggestions (max 100)
  - `total`: Optional total matches
  - `hasMore`: Additional results flag

## Error Handling[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#error-handling)

Servers **SHOULD** return standard JSON-RPC errors for common failure cases:

- Method not found: `-32601` (Capability not supported)
- Invalid prompt name: `-32602` (Invalid params)
- Missing required arguments: `-32602` (Invalid params)
- Internal errors: `-32603` (Internal error)

## Implementation Considerations[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#implementation-considerations)

1. Servers **SHOULD**:

   - Return suggestions sorted by relevance
   - Implement fuzzy matching where appropriate
   - Rate limit completion requests
   - Validate all inputs
2. Clients **SHOULD**:

   - Debounce rapid completion requests
   - Cache completion results where appropriate
   - Handle missing or partial results gracefully

## Security[](https://spec.modelcontextprotocol.io/specification/2025-03-26/server/utilities/completion/#security)

Implementations **MUST**:

- Validate all completion inputs
- Implement appropriate rate limiting
- Control access to sensitive suggestions
- Prevent completion-based information disclosure
