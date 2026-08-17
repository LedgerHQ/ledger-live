---
"@features/flow-app-lock": minor
"live-mobile": minor
---

Add the unlock screen and route every password check through one place.

`checkPassword` becomes the only function that verifies a password, used by both unlock and deactivation, so neither can drift into comparing against something stored. It derives with the parameters carried by the verifier rather than the current defaults, which is what lets a password set before a cost change still be proven.

The screen itself follows Figma: black full-bleed with the Ledger mark near the top, the shared password field under it, and the CTA labelled Confirm. It is forced to the dark palette rather than following the user's theme — the splash is black and this screen takes over from it with the mark in the same place, so a light rendering would flash on handover. It also carries no minimum-length rule, since the password may predate the six-character one.

Nothing mounts it yet: the orchestration, the biometric path and the forgot-password sheet are the gate.
