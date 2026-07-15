---
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
---

Remove the legacy add-account modal, DataSelector drawers and modular drawer visibility gating now that the Modular Drawer is the only flow. All Live App, stake, send and account-selection entry points use the modular flows unconditionally, and the `useModularDrawerVisibility` hook is removed in favor of a dedicated `ModularDrawerVisibleParams` type.
