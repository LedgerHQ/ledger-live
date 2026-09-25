---
"@features/platform-contacts": minor
"@features/flow-contacts-list": minor
"@features/flow-contacts": minor
"@features/flow-pay-contact": patch
"@devtools/pay-card": minor
"@ledgerhq/live-common": minor
"live-mobile": patch
"ledger-live-desktop": patch
---

Show every Me contact name as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. Data keeps raw names plus `isMe`; only rendering formats. `ContactAvatar` now takes `isMe` and formats the Me label itself; `MeAvatar` is no longer exported. Adds `useOtherContactsAddresses` and `@features/platform-contacts/testing`. Removes `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and the `formatMeDisplayName` labels. In live-common, `MatchedContact` and `RecipientHeaderContact` carry `isMe`, and `RecipientHeaderPresentation.label` is renamed `recipientDisplayValue` and never holds a contact name. The Me address picker says "Select my address". Dev tools get a "Pay contact success (Me)" quick action.
