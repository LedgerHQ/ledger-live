---
"ledger-live-desktop": minor
"live-mobile": minor
---

`useSendAmount` takes the `cryptoCurrency` to convert instead of the `account` holding it. Callers resolve it with `getAccountCurrency` on the same account they passed before, so a token account still converts with its token. The hook no longer imports any account type or helper.
