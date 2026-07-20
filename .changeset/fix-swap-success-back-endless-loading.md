---
"live-mobile": minor
---

Fix the endless loading state when navigating back from the Swap success screen. React Navigation v7 pushed a new SwapPendingOperation on top of SwapLoading instead of reusing the existing one, leaving SwapLoading beneath the success screen. Any back gesture — Android system back, iOS swipe-back, or the close (X) button — would pop to SwapLoading and get stuck. The fix replaces the SwapSubScreensNavigator via BaseNavigator so the success screen always starts with a clean [SwapPendingOperation] stack, making all back paths (back button, close button, and via Swap history) return correctly to the Swap input.
