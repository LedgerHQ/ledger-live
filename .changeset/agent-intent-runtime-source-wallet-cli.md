---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): require agent-intent enroll to declare the agent runtime

`agent-intent enroll` no longer defaults `--source` to `openclaw`. The agent must pass the runtime
it runs in from the SDK's controlled list (`openclaw`, `hermes`, `claude-code`, `codex`, `cursor`,
`muse`, `grok-bot`, or `other`), so the Agent Intent frontend shows the real source instead of
OpenClaw for every agent. The vendored Agent Intent SDK is refreshed to the version that adds these
values.
