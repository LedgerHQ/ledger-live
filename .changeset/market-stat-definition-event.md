---
"live-mobile": patch
---

Fix the analytics event fired when opening the average entry price definition drawer. It now emits a `button_clicked` event with `button: market_stat_definition`, matching the market stat tooltip convention, instead of an event named `market_stat_definition`.
