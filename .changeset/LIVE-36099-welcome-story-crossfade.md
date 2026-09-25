---
"live-mobile": patch
---

Fix welcome screen flicker on mobile: crossfade between onboarding stories instead of a hard `display:none`/`flex` swap, which detached the off-stage video player and repainted a black frame when a story was revealed. Off-stage stories now stay composited and fade with opacity, removing the flicker during story transitions.
