---
"ledger-live-desktop": minor
---

LWD - W4.0 - Support a `category` param in the Market deeplink (e.g. `ledgerwallet://market?category=stocks`). When present, the category is pre-selected (`setMarketCategory`) before navigating to `/market`; unknown values fall back to `all`.
