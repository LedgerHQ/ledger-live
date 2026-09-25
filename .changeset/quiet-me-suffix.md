---
"@features/platform-contacts": minor
"@features/flow-contacts-list": minor
"@features/flow-contacts": minor
"@features/flow-pay-contact": patch
"@ledgerhq/live-common": minor
"live-mobile": patch
"ledger-live-desktop": patch
---

Show every Me contact name as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one shared `useContactDisplayName` hook. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and the `formatMeDisplayName` labels. Fixes the raw Me name in the Send recipient list, recipient card, amount step header, Pay success, Pay contacts, address picker, History, address dialog, duplicate-address error and Me avatar label. `MatchedContact` and `RecipientHeaderContact` now carry `isMe`.
