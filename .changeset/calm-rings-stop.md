---
"@ledgerhq/wallet-cli": minor
---

Fail `ring destroy` with exit 1 when stdin ends before the confirmation, and cancel it on Ctrl-C or Ctrl-D at the prompt, instead of hanging at 100% CPU
