# MCP directory metadata

`server.json` describes the existing `@zof-ai/mcp-server` npm package. `package.json` carries the matching MCP Registry ownership marker, `io.github.Zof-AI/zof-mcp-server`. `glama.json` identifies the authorized GitHub maintainer for the existing organization-owned Glama entry. Neither file grants a new repository permission or publishes a listing by itself.

## Current preparation state

These metadata changes retain version **0.1.2** to match the current source/runtime. The already-published npm 0.1.2 artifact does **not** contain `mcpName`. Adding the field in source cannot alter that immutable artifact: do not publish this descriptor to the MCP Registry yet. A reviewed new package version and its public installation checks are required first. No release, Registry publication or Glama account claim is implied by this change.

## Runtime contract

The package runs over **stdio**, with exactly two server arguments: `--workspace` and a local directory path. `server.json` expresses these as two positional entries so clients preserve the existing two-argument CLI contract instead of converting it to `--workspace=PATH`. The second entry is required and has no broad default. Clients must pass argument arrays without a shell. Choose one existing narrow project directory; filesystem roots and the home directory are rejected.

The npm package requires Node.js 22 or newer; Node 22 and 24 are the tested versions. File-based operations require Linux/macOS and Python 3.10 or newer. Windows file operations fail closed. Six read-only tools provide static verification, impact analysis, evidence, policy evaluation and test suggestions. There is no Zof account requirement, API key, HTTP transport, hosted connection, arbitrary shell execution, source upload or test execution. The README documents bounds and unsupported Git/filesystem metadata.

The optional publisher metadata records these limits for discovery. Registry consumers may ignore those fields, so the README remains the setup and compatibility reference. Registry-driven npm installation may fetch packages; that is distinct from this server's local-only tool execution.

## Official MCP Registry release prerequisites

1. Review these metadata changes and select the next unused package version. Update `package.json`, package-lock root versions, `server.json` top-level/package versions, the CLI/protocol version constants, and release documentation together. Do not reuse published 0.1.2 or change exact dependency versions without review.
2. Build and run the protocol/negative tests under a supported Node runtime. Pack with scripts disabled; inspect the tarball for `mcpName`, the correct entry point, `server.json`, and the package allowlist. Validate `server.json` against its linked official schema and run `mcp-publisher validate server.json`. Successful descriptor validation does not establish package publication or ownership verification.
3. Publish the reviewed new npm artifact only through the authorized release process. Verify its exact public `mcpName`, version, integrity and clean installation. The Registry verifies the published package, not just this source checkout.
4. Authenticate using the existing authorized maintainer. The `io.github.Zof-AI/*` namespace requires an active organization Owner; repository admin rights alone are insufficient. Complete any new Registry OAuth authorization explicitly through the account owner's approval flow. Do not copy credentials into this repository.
5. Recheck the existing namespace/server record before publication, then publish the reviewed descriptor. Verify the returned public version and installation metadata before claiming Registry availability.

See [official quickstart](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx), [authentication rules](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/authentication.mdx), and [package verification](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/package-types.mdx).

## Existing Glama entry

Use the existing [Zof MCP server entry](https://glama.ai/mcp/servers/Zof-AI/zof-mcp-server), not a new submission. After the reviewed `glama.json` reaches the public default branch and Glama syncs it, sign in as the declared maintainer through the [claim/admin route](https://glama.ai/mcp/servers/Zof-AI/zof-mcp-server/admin). Glama's organization-repository workflow recognizes the maintainer declaration on sync. Any new OAuth permission or terms gate still requires the account owner's action.

Request a repository re-sync from the claimed entry if its README is stale. Verify that the entry reflects the released npm installation instructions and local-only scope; a claim does not establish Registry publication or hosted compatibility. No Docker build or hosted deployment is configured by these metadata files.
