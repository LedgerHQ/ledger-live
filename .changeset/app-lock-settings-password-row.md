---
"live-mobile": minor
---

Derive the Settings password switch from the stored protection state instead of flipping it on tap, behind `lwmPasswordRevamp`.

The legacy row moved its own local state as soon as the switch was touched, so cancelling the add or the removal flow left the switch disagreeing with reality until the screen regained focus. The revamped row reads `hasPassword` and lets the flow decide.

This is also what makes setting a password visible: the verifier already landed, but nothing in Settings reflected it.
