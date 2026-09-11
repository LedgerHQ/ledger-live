---
"live-mobile": patch
---

Announce the receive QR code to screen readers

The QR container on the shared receive confirmation screen carried a `testID` but no
`accessible` prop, so it never joined the accessibility tree. It is now a focusable
element with a role and a localized label, instead of being skipped or announced as
an unlabeled node.
