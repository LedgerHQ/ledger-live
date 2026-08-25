---
"live-mobile": minor
---

Fix the receive verify-address drawer becoming unusable a few seconds after opening on Android

The drawer opened correctly, then snapped back off-screen after 3-4 seconds and left an opaque backdrop with nothing tappable. It prevents backdrop dismissal, so the only way out was to force-quit the app mid receive flow.

`useAnimatedStyle` only writes its initial value into the Fabric shadow tree, which still held the closed position while the drawer was open. Any commit outside Reanimated's commit hook re-applied it, and nothing wrote the transform again because the open animation had long finished. The resting position is now mirrored in React state and declared after the animated style, so such a commit settles on open. The same applies to the backdrop opacity and to the security modal's scroll view height, which collapsed to zero for the same reason.
