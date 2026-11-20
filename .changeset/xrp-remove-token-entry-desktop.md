---
"ledger-live-desktop": minor
---

XRP: remove a token, behind `enabledTokenStandards`. Token account pages get one header action: Manage token for an IOU, which offers Advanced settings and Remove token, and Remove token for an MPT. Remove token is disabled while the token is frozen or its removal pending, and signs an `optOut`, asks to send a held balance first, and shows the XRP it unlocks. The trust limit edit moves from the balance footer into Manage token.
