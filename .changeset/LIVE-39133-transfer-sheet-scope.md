---
"live-mobile": minor
---

The Transfer sheet now receives its scope (wallet, asset or account) when it is opened instead of through mount props. The account scope opens Receive directly on the account; Send asks which asset of the account to send when several have a spendable balance, and is disabled when none has. Portfolio and Asset Detail behaviour is unchanged.
