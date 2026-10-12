---
"@domain/entity-contact": minor
"@features/platform-contacts": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

refactor(contacts): clean up the Contacts debug tools

The send-history contacts builder was copied in both apps. It now lives once in
`@domain/entity-contact/schema.mock` as `mockContactsFromSendHistory`. `@features/platform-contacts`
adds `parseExcludedCurrencyIdsInput`, which works like `parseEligibleAddressFamiliesInput`. The
desktop tool no longer copies flag params into local state with effects. Its inputs show the flag
value unless you are editing them, use `cn`, and have no hard-coded strings left. The mobile tool
drops its `StyleSheet`, shows the families as tags, and builds the flag preview in its view model.
