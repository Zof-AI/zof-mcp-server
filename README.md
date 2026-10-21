# Zof MCP server

Give a compatible coding agent read-only access to bounded local change verification. Six tools use the official MCP SDK and stdio. The host chooses one workspace at startup; tool arguments cannot change it. No account, network service, shell tool, plugin loading or repository upload is provided.

<!-- ZOF_NPM_INSTALL_START -->
## Install from npm

Use Node.js 22 or 24 and npm. File-based operations require Linux or macOS with Python 3.10 or newer; Windows file operations fail closed. In a new project directory, install the version used by this guide:

```sh
npm install --ignore-scripts --save-exact @zof-ai/mcp-server@0.1.2
npx --no-install zof-mcp-server --help
```

The package includes compiled JavaScript, TypeScript declarations and its runtime dependencies. No source build, Zof account or repository upload is required. `--ignore-scripts` disables installation lifecycle scripts; `--no-install` keeps the example commands from downloading another package.

Confirm the public ESM entry point; this prints `function`:

```sh
node --input-type=module -e "import('@zof-ai/mcp-server').then(api => console.log(typeof api.createServer))"
```

Use the MCP client configuration below to start the installed server and call its six local tools. Stdout is reserved for MCP protocol traffic.

Package: [@zof-ai/mcp-server](https://www.npmjs.com/package/@zof-ai/mcp-server). The source-checkout instructions and three additional workflows follow.
<!-- ZOF_NPM_INSTALL_END -->

<!-- ZOF_RELEASE_INSTALL_START -->
## Install from GitHub source

Requires Node.js 22 or 24, npm, and Git. Filesystem operations require Linux or macOS with Python 3.10 or newer; Windows file operations fail closed. Clone this repository and explicitly prepare its reviewed release dependencies:

```sh
git clone --branch v0.1.2 --depth 1 https://github.com/Zof-AI/zof-mcp-server.git
cd zof-mcp-server
node scripts/bootstrap.mjs --allow-network
npm ci --ignore-scripts --prefer-offline
npm run build
npm test
```

The bootstrap downloads only the exact versioned dependency assets from [GitHub Releases](https://github.com/Zof-AI/zof-mcp-server/releases), as listed in `scripts/release-dependencies.json`, verifies SHA256 and byte size, and adds them to the npm cache. It does not extract archives, run package scripts, collect application data, or send credentials. Downloads require the explicit flag and follow only HTTPS GitHub asset redirects. Installation then fetches ordinary third-party dependencies from npm. Use a writable npm cache; set `npm_config_cache` consistently for both commands if needed. An unavailable asset, changed hash, or oversized response stops installation.

<!-- ZOF_RELEASE_INSTALL_END -->

## Install and run

After npm installation, configure an MCP stdio client to run the installed entry point:

```json
{
  "mcpServers": {
    "zof": {
      "command": "node",
      "args": ["/absolute/path/to/install/node_modules/@zof-ai/mcp-server/dist/cli.js", "--workspace", "/absolute/path/to/your/project"]
    }
  }
}
```

Replace both absolute paths, using the project where you ran `npm install` for the first and the narrow workspace to inspect for the second. Use a supported Node executable. Connect the client and call `zof_get_capabilities` with `{}`. A source checkout can instead use `node dist/cli.js --workspace /absolute/path/to/your/project`. Stdout is exclusively MCP protocol traffic.

## Three practical client examples

1. Configure an MCP stdio client with the Node entry-point configuration above. Call `zof_get_capabilities` with `{}` to inspect limits and unavailable hosted support.
2. Call `zof_verify_change` or `zof_generate_evidence` with `{"changedFiles":["src/math.ts"]}`. The result describes static checks; it does not assert tests ran. Call `zof_analyze_impact` with the same arguments to inspect dependencies.
3. Call `zof_evaluate_policy` with `{"policyPath":"policy.json","evidencePath":"evidence.json"}`. Or call `zof_suggest_tests` with `{"sourcePath":"src/math.ts","language":"typescript","functions":["add"],"module":"./math.js"}` for reviewable local test candidates. No generated code executes or is written.

See examples/client.json for configuration. Replace its entry-point path with the installed package path and its workspace argument with a narrow local project path; home and filesystem roots are rejected. The npm-installed server and built source checkout expose the same tools. Never put credentials in client configuration or command arguments.

## Protocol and safety contract

Every tool declares an input and output JSON schema. Successful responses contain JSON text plus `structuredContent.result`; invalid local operations return `isError: true` and a fixed safe error. SDK schema failures are protocol validation errors. All tools are read-only and closed to external resources. Hidden paths, traversal, unsupported types and symlink artifact reads are rejected. Inputs are limited to 1 MiB per stdio frame; outputs to 4 MiB; concurrent tool operations to two. Filesystem/graph bounds are inherited from public libraries. Cancellation is cooperative at operation boundaries; synchronous parsers cannot be interrupted mid-call. A 30-second abort signal is checked before returning; bounded filesystem analysis may continue until its next checkpoint. No arbitrary process execution is exposed.

## Compatibility

| client | status |
|---|---|
| Official MCP TypeScript SDK client 1.32.1, stdio | tested through real child process and protocol |
| Other MCP stdio clients | compatible transport design; not individually accepted |
| Remote HTTP transport | not implemented |

Tests cover discovery, every tool, schemas, cancellation before request, traversal, symlinks, malformed evidence, oversized inputs and clean shutdown. Specific desktop-client compatibility requires testing against that client; the stdio protocol is tested with the official MCP SDK. See SECURITY.md and docs/RELEASE.md. Built independently for https://zof.ai; no functional hosted integration is advertised. Licensed under [Apache-2.0](LICENSE).

## Filesystem and Git boundaries

Filesystem operations use bounded, directory-relative descriptors on Linux/macOS with Python 3.10 or newer. Symlinks, hard-linked inputs, special files and traversal are rejected. Open descriptors remain attached to the original directory when names change. File contents can still change during a read or snapshot; this is not an atomic filesystem snapshot. Windows filesystem operations fail closed; in-memory JSON validation and analysis do not require the file helper. Git reads use a private bounded snapshot: 256 MiB total, 32 MiB per source/object file, 50,000 entries and 64 directory levels. Repository hooks/configuration are not used; local `.git/info/exclude` and `.git/info/attributes` are preserved. External Git metadata, object alternates, grafts, sparse-checkout metadata, linked worktrees and submodules are unsupported. Limits and unsupported metadata cause an explicit error or incomplete result.

## Directory metadata

The repository includes MCP Registry preparation metadata and a maintainer declaration for the existing Glama entry. Registry publication still requires a new reviewed npm version containing the ownership marker; the published 0.1.2 package predates that field. See [distribution prerequisites](docs/DISTRIBUTION.md) for the exact runtime contract and release/claim steps.
