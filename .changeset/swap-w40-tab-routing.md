---
"live-mobile": minor
---

LIVE-30737: Fix Swap opening on the legacy (pre-Wallet 4.0) navigation stack from several entry points. When the Wallet 4.0 main navigation is enabled, the SwapNavigator is a tab inside the Main navigator (with the top header and bottom tab bar); navigating to the base-level SwapNavigator instead lands on the legacy stack with no header and no tab bar. A shared `navigateToSwapTab` helper now centralises the Wallet 4.0-aware routing, and the No-funds drawer and the staking "not enough balance" swap CTA route through it (previously they always opened the legacy stack).
