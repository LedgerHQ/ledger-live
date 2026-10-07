---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): default agent-intent enroll --source to other instead of openclaw

`agent-intent enroll` used to default `--source` to `openclaw`, so every agent that didn't pass it
showed up as OpenClaw in the Agent Intent frontend. When `--source` is omitted it now defaults to
`other`; pass `--source openclaw` to keep the previous value. The accepted values are unchanged (the
SDK's controlled list), and the skill and README now tell agents to always pass the runtime they run
in. The value is self-declared and not verified. `agent-intent recover` still supports only
`openclaw` and `hermes` profiles; its error and docs now say to enroll a fresh profile for any other
source.
