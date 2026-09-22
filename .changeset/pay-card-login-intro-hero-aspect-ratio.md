---
"@features/flow-pay-card-auth": patch
"@features/flow-pay-card": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix the login intro hero image and the desktop top up button.

- The hero container keeps the image aspect ratio, so the image no longer crops on a wide phone.
- The sticky top up button in the desktop right panel loses its opaque background, so it floats over the content.
