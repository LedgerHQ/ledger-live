---
"@features/flow-account-detail-settings": minor
"@domain/entity-currency-crypto": patch
"@shared/linking": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Account settings (LWM bottom sheet, LWD dialog) show a **View Explorer** entry under Advanced logs that opens the account's address in the currency's block explorer, hidden when the currency has none. The package builds the URL from the account's currency and address with `@domain/entity-currency-crypto` and opens it through `@shared/linking` as a sensitive link: `openLink(url, { sensitive: true })` still opens the full URL but only reports its origin to `onLinkOpened`, so the address never reaches analytics; `getDefaultExplorerView` accepts any object carrying `explorerViews`.
