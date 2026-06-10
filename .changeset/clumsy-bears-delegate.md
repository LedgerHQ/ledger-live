---
"live-mobile": minor
---

Fix SEI delegation amount screen displaying the raw `NotEnoughBalance` error name instead of a translated message. The amount step now renders the error through `TranslatedError`, so an over-balance delegation shows "Sorry, insufficient funds".
