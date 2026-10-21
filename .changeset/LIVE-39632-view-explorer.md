---
"@features/flow-account-detail-settings": minor
"@domain/entity-currency-crypto": patch
"live-mobile": minor
"ledger-live-desktop": minor
---

Account settings (LWM bottom sheet, LWD dialog) show a **View Explorer** entry under Advanced logs that opens the account's address in the currency's block explorer, hidden when the currency has none. The package builds the URL from the account's currency and address with `@domain/entity-currency-crypto` and opens it through `@shared/linking`; `getDefaultExplorerView` accepts any object carrying `explorerViews`.
