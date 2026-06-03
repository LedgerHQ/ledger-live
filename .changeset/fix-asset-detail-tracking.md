---
"live-mobile": minor
---

Fix incorrect analytics on the Asset Detail screen to match the tracking plan: the address button now reports `Account`, the favourite/hide toggles report `favourite`/`hide_asset`, the market-stat info bubble fires a `button_clicked` (`market_stat_definition`) event with tracking added on the available-balance bubble, and the Transactions header reports `Transactions`.
