---
"@ledgerhq/wallet-cli": minor
---

feat(wallet-cli): add agent-intent status to read one intent's current state

`agent-intent status --profile <id> --intent <id>` shows the current status and details of one intent the profile proposed, using its own key. JSON adds `terminal` (true once the state is final, null for a state this version does not know) for shell polling. An unknown id and another agent's intent get the same not-found answer.
