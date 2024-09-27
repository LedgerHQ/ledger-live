---
"live-mobile": patch
---

fix(wallet-api): only call success and fail handlers when closing the flow on LLM

Allows to properly retry the sign message without sending an error through the wallet-api
We also only send the success when we actually close the last success screen
