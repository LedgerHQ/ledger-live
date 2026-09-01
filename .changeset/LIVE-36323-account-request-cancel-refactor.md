---
"live-mobile": minor
---

Refactor `account.request` cancel-navigation out of `useUiHook` and fix premature cancel in the inline add-account flow.

**Refactor (LIVE-36323):** Remove host-specific `shouldGoBackOnCancelRef` from `useUiHook`. Expose plain `onAccountRequestCancel` / `onAccountRequestSuccess` callbacks instead. Exchange and Buy host screens now own the one-shot dismiss rule directly (`shouldGoBackRef` in `PTX/index.tsx`), eliminating the `goBackOnAccountRequestCancel` boolean→string→boolean round-trip through `inputs`.

**Bug fix (flagged by Earn team):** Since 6f1e402, `closeDrawer` fired `onCancel` immediately when the user tapped "Add Account" in the modular drawer, breaking Earn's inline add-account flow. Introduce `hideModularDrawer` — a Redux action that sets `isOpen = false` without clearing `callbackId` or `cancelCallbackId`. The navigate-to-device step uses this silent hide so `account.request` stays pending. The real cancel still fires via `onCloseNavigation` if the user abandons the device flow.
