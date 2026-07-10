---
"live-mobile": patch
---

Consolidate all push-notifications opt-in drawer triggers (onboarding, send/receive/swap/stake/add-favorite actions, Settings, and the opt-in screen) onto the single `notifyFlowCompleted` production path, and remove the now-dead legacy `useNotifications` hook chain.
