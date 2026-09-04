---
"@devtools/pay-card": minor
"@devtools/bindings": minor
---

Add a "Balance" screen to the Card / Pay devtool.

- Opening it requests the card-linked wallets and shows the total the balance calculation returned, unformatted, in the counter-value currency's smallest unit.
- Lists every wallet with every field the calculation saw, including the provider's own unmapped `currency` and `network` ids, so a currency-mapping gap can be read off the screen.
- Says why a wallet has no balance or no counter value, so it does not read as a zero.
- Reports a total nothing could be priced into as absent, not as zero.
- Pricing is the host's: it passes `resolveCounterValue` in. The wallets are read either way, and the screen says when a host wired none.
- Names the endpoint that failed and prints what it answered, rather than reporting that something failed.
- A refresh button refetches them.
- Both devtool entries sit in one "Debug" section, matching the sections around them.
