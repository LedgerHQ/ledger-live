---
"live-mobile": minor
"@features/flow-app-lock": minor
"@features/platform-app-lock": minor
---

Let any part of the app ask for the app to be protected before it continues, and answer for it.

A feature that needs protection — the Card, first — now awaits one call: `requestProtection()`. The prompt decides what to ask for, so no caller looks at biometry: biometrics if the device has some enrolled, a password otherwise. An already-protected user is never interrupted and their action simply runs.

The password path opens the existing add-password flow and comes back with a confirmation sheet, so the caller resumes where it left off. Dismissing the prompt, or backing out of the password flow, holds the caller's action instead — a request never resolves as protected unless protection is actually in place.

Both sheets are mounted once, above the screens, so navigating away no longer closes the prompt the way a screen-owned sheet would.
