---
"@ledgerhq/live-network": minor
---

Decouple from `@ledgerhq/live-env` via local state singleton. Network configuration (timeouts, log flags, client version) is now managed via `setNetworkState()` and defaults to the previous env var values. Consumers in the monorepo call `bridgeEnvToNetworkState()` from `@ledgerhq/live-common/network/setup` at boot. External consumers get sensible defaults with no setup required.
