---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add agent-intent cancel to withdraw an intent before the user signs it

`agent-intent cancel --profile <id> --intent <id>` cancels an intent the profile proposed while it is `created` or `crafted`. It shows the intent and asks for confirmation on a terminal, and needs `--yes` without one. A repeat succeeds with `alreadyCancelled: true`; any other state fails with the intent's current state. `cancelled` is now a final state in `agent-intent status` and a `--status` filter of `agent-intent intents`.
