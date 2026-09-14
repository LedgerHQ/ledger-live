---
"@devtools/pay-card": minor
---

Give the desktop devtool the screens the mobile one has.

- "Card Status" runs the endpoint probes and requests the rendered card details.
- "Card onboarding" shows each derived step, the count and the answer it was worked out from. The status is read when the screen asks for it rather than when the tool mounts, and on either host: both apps mock the Card endpoints now, so refreshing and toggling work on desktop too.
- "Currency Mapping" lists the asset catalog, scrollable sideways so a long Ledger id is not truncated.
