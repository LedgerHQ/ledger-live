---
"@ledgerhq/wallet-cli": minor
---

Update `@ledgerhq/agent-intent-sdk` to 0.4.0. `agent-intent enroll` and `recover` keep waiting when the human leaves the approval page and opens the link again, and `--expires-in` above 24 days no longer fails right after the link is printed. An agent enrolled without Ledger Sync account access is saved as enrolled: `enroll` and `wait` report `account access: not shared` (no `accountAccessEnvironment` in JSON), and `sync` explains that the profile has no accounts to import
