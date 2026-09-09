---
"@devtools/pay-card": minor
"@devtools/bindings": minor
---

Add a "Balance" screen to the Card / Pay devtool.

- Three sections: "Baanx wallets" and "Card linked wallets" are the two wallet responses exactly as they arrived, "Card linked combined wallets" is the join the app builds from them.
- Every field is shown unformatted, the provider's own unmapped `currency` and `network` ids included, so a currency-mapping gap can be read off the screen.
- A joined row with no Baanx wallet behind it says so rather than reading as a zero.
- Each section counts what it got, so an empty answer does not read as a missing one.
- Names the endpoint that failed and prints what it answered, rather than reporting that something failed.
- A refresh button refetches both.
- Opening the screen is what requests them; the tool mounts without reading anything.
