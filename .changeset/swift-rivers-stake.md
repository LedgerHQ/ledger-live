---
"live-mobile": patch
---

Centralize the stake-flow push-notification trigger into a shared `useStakeFlowCompletionListeners` hook (replacing the same `beforeRemove` wiring duplicated across 36 family flows) and replace the slow per-family render suite with a lightweight wiring guard
