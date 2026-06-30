---
"live-mobile": patch
---

Fix the Swap history "Previous" button playing the forward (push) transition instead of the back (pop) one in Wallet 4.0. The history sub-screen is pushed on top of Main, so we now pop the parent navigator instead of resetting it, restoring the correct left-to-right back animation.
