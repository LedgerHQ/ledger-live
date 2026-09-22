---
"ledger-live-desktop": patch
---

Add test IDs to the My Ledger controls that automation has to click.

The manager screen already exposes test IDs for its containers, inputs and success states, but not for several triggers and submit buttons, so those flows could not be driven from a test. This adds them to the app catalog's Show and Sort dropdowns, the device rename entry point and its submit button, the custom lock screen removal link and its success state, and the OS version and genuine badge values.

No behaviour changes: every addition is a `data-testid` attribute.
