---
"ledger-live-desktop": minor
"@features/flow-account-detail-notices": minor
---

Account Detail on LWD shows the account notices (currency migration, deprecation and custom banners, Robinhood disclaimer, Perps) and the family blocks (pending transfer proposals, sub header, balance summary footer, body header) in the custom place. The notices package now maps the remote currency config into notice signals (`toCurrencyStatusSignal`, `toCustomBannerSignal`).
