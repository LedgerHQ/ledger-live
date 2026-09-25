---
"@features/platform-contacts": minor
"@features/flow-contacts-list": patch
"@features/flow-contacts": patch
"@features/flow-pay-contact": minor
"live-mobile": patch
"ledger-live-desktop": patch
---

`ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.
