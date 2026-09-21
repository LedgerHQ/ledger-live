---
"@features/flow-pay-card-auth": minor
"@features/flow-pay-card-details": minor
"@features/flow-pay-card": minor
---

Expose settings redirect actions for Manage PIN, Access Baanx and Help on the card's More menu.
The feature packages take already-resolved host callbacks and never build URLs or read env vars
themselves — desktop opens Baanx pages through the existing hosted-page opener, mobile through the
secure browser, and each app opens the Help article externally.
