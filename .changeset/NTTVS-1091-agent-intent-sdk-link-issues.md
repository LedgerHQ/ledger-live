---
"@ledgerhq/wallet-cli": patch
---

Update the vendored `@ledgerhq/agent-intent-sdk`. `agent-intent enroll` takes its name and description limits from the SDK, and now rejects a `--name` or `--description` made only of spaces before creating an identity
