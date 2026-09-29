---
"@features/platform-contacts": minor
"@features/flow-contacts-list": minor
"@features/flow-contacts": minor
"@features/flow-pay-contact": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

`ContactAvatar` takes `isMe` and is the only avatar that formats the Me label, so a Me avatar is announced once as "<name> (Me)". `MeAvatar` takes a display-ready `label` and is no longer exported; `ME_AVATAR_URL` stays exported. `PaySuccessRecipient.isMe` is now required.
