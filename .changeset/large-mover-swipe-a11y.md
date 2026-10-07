---
"live-mobile": patch
---

Large Mover: screen readers only read the front card, and swiping up/down on the coin shows the next or previous one. The swipe integration test no longer relies on gesture-handler jest-utils, which made it flaky.
