# Zof MCP server

Give a compatible coding agent read-only access to bounded local change verification. Six tools use the official MCP SDK and stdio. The host chooses one workspace at startup; tool arguments cannot change it. No account, network service, shell tool, plugin loading or repository upload is provided.

## Install and run

Requires Node 22 or 24 and Git. This is an unpublished candidate. After foundation publication, source installation is `npm ci --ignore-scripts`, `npm run build`, `npm test`. Candidate review installs the approved local tarballs first. Start with `node dist/cli.js --workspace /absolute/path/to/synthetic-project` (the installed command is `zof-mcp-server`). Stdout is exclusively MCP protocol traffic.

## Three practical client examples

1. Configure any MCP stdio client with command `zof-mcp-server` and args `["--workspace", "/absolute/path/to/your/project"]`. Call `zof_get_capabilities` with `{}` to inspect limits and unavailable hosted support.
2. Call `zof_verify_change` or `zof_generate_evidence` with `{"changedFiles":["src/math.ts"]}`. The result describes static checks; it does not assert tests ran. Call `zof_analyze_impact` with the same arguments to inspect dependencies.
3. Call `zof_evaluate_policy` with `{"policyPath":"policy.json","evidencePath":"evidence.json"}`. Or call `zof_suggest_tests` with `{"sourcePath":"src/math.ts","language":"typescript","functions":["add"],"module":"./math.js"}` for reviewable local test candidates. No generated code executes or is written.

See examples/client.json for configuration. Replace its workspace argument with a narrow local project path; home and filesystem roots are rejected. Install candidate tarballs explicitly until a public package is verified. Never put credentials in client configuration or command arguments.

## Protocol and safety contract

Every tool declares an input and output JSON schema. Successful responses contain JSON text plus `structuredContent.result`; invalid local operations return `isError: true` and a fixed safe error. SDK schema failures are protocol validation errors. All tools are read-only and closed to external resources. Hidden paths, traversal, unsupported types and symlink artifact reads are rejected. Inputs are limited to 1 MiB per stdio frame; outputs to 4 MiB; concurrent tool operations to two. Filesystem/graph bounds are inherited from public libraries. Cancellation is cooperative at operation boundaries; synchronous parsers cannot be interrupted mid-call. A 30-second abort signal is checked before returning; bounded filesystem analysis may continue until its next checkpoint. No arbitrary process execution is exposed.

## Compatibility

| client | status |
|---|---|
| Official MCP TypeScript SDK client 1.32.1, stdio | tested through real child process and protocol |
| Other MCP stdio clients | compatible transport design; not individually accepted |
| Remote HTTP transport | not implemented |

Tests cover discovery, every tool, schemas, cancellation before request, traversal, symlinks, malformed evidence, oversized inputs and clean shutdown. Public installation and specific desktop client acceptance remain release gates. See SECURITY.md and docs/RELEASE.md. Built independently for https://zof.ai; no functional hosted integration is advertised. Proposed Apache-2.0 licensing requires legal/owner approval.
