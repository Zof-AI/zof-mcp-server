# Changelog

## 0.2.0

BREAKING: renamed so this offline package never collides with the hosted `zof` server (https://mcp.zof.ai/mcp). The MCP server name is now `zof-local` (title "Zof (local, offline)"); the client config key is now `zof-local`. Every tool is renamed and its description notes it is a local estimate only.

| Old | New |
| --- | --- |
| `zof_verify_change` | `zof_local_verify_change` |
| `zof_analyze_impact` | `zof_local_analyze_impact` |
| `zof_evaluate_policy` | `zof_local_evaluate_policy` |
| `zof_generate_evidence` | `zof_local_generate_evidence` |
| `zof_suggest_tests` | `zof_local_suggest_tests` |
| `zof_get_capabilities` | `zof_local_get_capabilities` |

## 0.1.2

Document public installation, executable entry points and reproducible packaged examples. Align release dependency pins; runtime behavior is unchanged.

## 0.1.1

- Update affected dependencies to the hardened diff parser and refresh reviewed release artifacts.

## 0.1.0

Initial independently authored public implementation, distributed under Apache-2.0.
