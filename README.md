# n8n-nodes-nugu

Reusable in-house n8n community nodes maintained by `nuguseyo-bird`.

This package starts small on purpose: it provides utility nodes we repeatedly need in internal workflows, and can grow as more helpers become stable enough to share across workflows.

[n8n](https://n8n.io/) is a workflow automation platform.

## Installation

Install this package from the n8n community nodes UI:

1. Open n8n.
2. Go to **Settings → Community nodes**.
3. Choose **Install**.
4. Enter `n8n-nodes-nugu`.
5. Restart n8n if your deployment requires it.

You can also install it with npm in a custom n8n deployment:

```bash
npm install n8n-nodes-nugu
```

## Nodes

### Nugu Text Utility

Small text helpers for workflow glue code.

Operations:

- **Clean Text**
  - Normalizes CRLF to LF.
  - Optionally collapses consecutive whitespace to a single space.
  - Optionally trims leading and trailing whitespace.
  - Writes the result to a configurable output field.

- **Extract JSON**
  - Extracts the first JSON object or array from a text value.
  - Optionally strips surrounding Markdown code fences such as <code>```json</code>.
  - Can merge parsed JSON into the input item, replace the item, or write it under a field.

Typical use cases:

- Cleaning LLM output before writing to a database.
- Parsing JSON returned by models that wrap results in Markdown fences.
- Reducing small Code-node snippets in frequently reused workflows.

## Credentials

No credentials are required.

## Compatibility

Built with the official `@n8n/node-cli` community-node tooling.

## Development

```bash
npm install
npm run build
npm run lint
```

## Version history

See [CHANGELOG.md](./CHANGELOG.md).
