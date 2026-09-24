---
"@ledgerhq/live-common": minor
"@features/platform-contacts": minor
"@features/flow-contacts-list": minor
"@features/flow-contacts": minor
"@features/flow-pay-contact": patch
"live-mobile": patch
"ledger-live-desktop": patch
---

Always show Me in the Send recipient contact list, with only its addresses on the account network, ordered like the other contacts (last sent to first). Draw Me with one `MeAvatar` everywhere: `ContactAvatar` renders it for the Me contact, so the `meAvatarSrc`, `avatarSrc` and `isMe` avatar props are gone.
