---
"@ledgerhq/wallet-cli": minor
---

Fail `ring destroy` with exit 1 when stdin ends before the confirmation, exit 130 on Ctrl-C and cancel on Ctrl-D at the prompt, instead of hanging at 100% CPU
