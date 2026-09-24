---
"@features/flow-pay-card": minor
"@features/flow-pay-card-details": minor
---

Show what each card wallet is worth in the user's currency.

- The Assets list is implemented: both views were placeholders that rendered nothing.
- A row is the design's: currency icon, name and ticker, then the counter value over what the wallet holds.
- The counter value is left off when nothing could price the wallet; the crypto amount always shows.
- `CardAssets` takes the currencies, the pricing and the formatter from the host, so the package stays free of the rates.
- Native lists it inside the card details sheet, under the card actions, where the design puts it; `CardDetails` takes it as a slot.
