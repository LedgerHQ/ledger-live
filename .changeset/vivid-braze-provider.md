---
"ledger-live-desktop": minor
"@ledgerhq/live-common": patch
---

Extract a desktop BrazeProvider and wire consent transitions to the shared identity lifecycle

Fix the desktop Braze consent transition to correctly propagate SDK re-initialization failures, add a timeout so a stalled content-cards refresh no longer blocks consent transitions forever, and share the identity-sync decision logic (`@ledgerhq/live-common/braze/identitySync`) to avoid duplicating it across platforms.
