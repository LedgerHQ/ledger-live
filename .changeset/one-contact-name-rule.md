---
"@features/platform-contacts": minor
"@features/flow-contacts-list": minor
"@features/flow-contacts": minor
"@features/flow-pay-contact": patch
"live-mobile": patch
"ledger-live-desktop": patch
---

Show the Me contact as "<name> (Me)", or "My addresses (Me)" when it was never renamed, through one rule: `formatContactDisplayName`, wrapped by `useContactDisplayName`. It replaces `createMeDisplayNameFormatter`, `resolveMeContactDisplayName`, `identityFormatMeDisplayName` and every `formatMeDisplayName` label. Contact list items keep the raw name plus `isMe`, and rows render through the hook. Fixes the Me name in the Send recipient list, Pay contacts, the History scope and the address dialog. The Me address picker says "Select my address". Adds `@features/platform-contacts/testing`.
