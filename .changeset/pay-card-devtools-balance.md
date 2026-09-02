---
"@devtools/pay-card": minor
"@devtools/bindings": minor
"live-mobile": patch
---

Add a "Balance" screen to the Card / Pay devtool.

- Opening it requests the card-linked wallets and shows the total the balance calculation returned, unformatted, in the counter-value currency's smallest unit.
- Lists every wallet with every field the calculation saw, including the provider's own unmapped `currency` and `network` ids, so a currency-mapping gap can be read off the screen.
- A wallet with no match or no rate says which, so it does not read as a zero.
- Names the endpoint that failed and prints what it answered, rather than reporting that something failed.
- A refresh button refetches them.
- Both devtool entries sit in one "Debug" section, matching the sections around them.
- Pricing needs the app's rates and currency settings, so the host passes `resolveCounterValue` in; without one the wallets are never requested.
