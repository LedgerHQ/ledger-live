---
"live-mobile": patch
---

Fix the receive verify-address drawer becoming unusable a few seconds after opening on Android.

The drawer opened correctly and then snapped back off-screen after 3-4 seconds, leaving an opaque backdrop with nothing tappable. Because the drawer prevents backdrop dismissal, the only way out was to force-quit the app mid receive flow.

`useAnimatedStyle` only writes its initial value into the Fabric shadow tree, so while the drawer was open the shadow tree still held the closed position. Any commit not covered by Reanimated's commit hook re-applied it, and nothing wrote the transform again because the open animation had already finished. The resting position is now mirrored in React state and declared after the animated style, so the shadow tree stays correct and a commit settles on "open" instead of off-screen. The same fix is applied to the backdrop opacity and to the security modal's animated scroll view height, which collapsed to zero for the same reason.
