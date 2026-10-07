---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): let agent-intent enroll declare the agent runtime

`agent-intent enroll --source` now accepts every runtime in the SDK's controlled list (`openclaw`,
`hermes`, `claude-code`, `codex`, `cursor`, `muse`, `grok-bot`, `other`), so the Agent Intent
frontend shows the declared source instead of OpenClaw for every agent. **Behaviour change:** when
`--source` is omitted it now defaults to `other` instead of `openclaw`; pass `--source openclaw` to
keep the previous value. The value is self-declared and not verified. `agent-intent recover` still
supports only `openclaw` and `hermes` profiles; its error and docs now say to enroll a fresh profile
for any other source.
