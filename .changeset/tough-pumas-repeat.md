---
"@ledgerhq/wallet-api-exchange-module": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Centralize swap-quote formatting on the wallet side of `custom.exchange.getQuotes`. Each returned `Quote` now carries an optional `formatted: FormattedQuoteValues`, where every field is a `FormattedNumber` triplet (`numberValue` / `withPrefix` / `withSuffix`) — letting live-app consumers display locale-aware crypto, fiat, rate, and slippage values without owning the formatting logic.

Breaking wire change: `QuotesInput.counterValueCurrency` has been removed. The wallet now sources locale and counter-value currency from its Redux store and threads them into `getQuotes` via the `handlers({ locale, counterValueCurrency, ... })` factory, so the live app no longer needs to pass them on the wire.
