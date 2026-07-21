---
"@ledgerhq/wallet-cli": minor
---

Add a one-time, agent-aware first-run nudge that prints a tailored hint to stderr (e.g. `wallet-cli skill install --agent claude`) on the first real command, so agents discover the embedded skill. It is shown at most once per user (persisted via an XDG state marker), silent under `--output json` and for `skill *` commands, opt-out via `WALLET_CLI_NO_NUDGE=1`, and fully best-effort (never throws or changes exit codes). Agent detection is centralized in a new `agent-detection` helper that `isAgentEnvironment()` now delegates to.
