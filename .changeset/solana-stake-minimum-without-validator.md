---
"@ledgerhq/coin-solana": patch
"live-mobile": patch
---

fix(coin-solana): check the stake minimum before a validator is picked

The mobile delegation flow asks for the amount before the validator, so the recipient is still empty when the amount is validated. The minimum-delegation check was skipped in that case, which let an amount below 1 SOL through to the summary. The summary now also shows its validation error in the alert colour.
