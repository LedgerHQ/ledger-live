---
"live-mobile": minor
---

fix(rn-upgrade): bump bottom-sheet to 5.2.7 (LIVE-40458)

Bottom-sheet 5.2.7 guards useBoundingClientRect against a missing unstable_getBoundingClientRect, which React Native 0.86 removes. No change on the current React Native 0.81.
