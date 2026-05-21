---
"live-mobile": minor
---

Dedupe staking summary rotate animation into a shared `useChangeValidatorRotateAnim` hook and stop leaking the looping `Animated.loop` on unmount.
