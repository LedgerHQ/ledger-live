---
"@ledgerhq/wallet-cli": major
---

feat(wallet-cli): require agent-intent enroll to declare the agent runtime

**Breaking:** `agent-intent enroll` no longer defaults `--source` to `openclaw`, so an invocation
without `--source` now fails at flag parsing. To migrate, pass the runtime the agent runs in from
the SDK's controlled list (`openclaw`, `hermes`, `claude-code`, `codex`, `cursor`, `muse`,
`grok-bot`, or `other`); pass `--source openclaw` to keep the previous behaviour. The Agent Intent
frontend then shows the declared source instead of OpenClaw for every agent. The value is
self-declared and not verified. `agent-intent recover` still supports only `openclaw` and `hermes`
profiles; its error and docs now say to enroll a fresh profile for any other source.
