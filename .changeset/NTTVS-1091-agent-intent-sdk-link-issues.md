---
"@ledgerhq/wallet-cli": patch
---

Update the vendored `@ledgerhq/agent-intent-sdk`. `agent-intent enroll` takes its name and description limits from the SDK, and now rejects a blank `--name` or `--description` before creating an identity
