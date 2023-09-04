---
"live-mobile": patch
---

Fix: several bugs during the firmware update on LLM

Several bug were fixed:

- an issue on how "user solvable" errors were handled on the logic and UI of the fw update
- a bug on errors that were supposed to be ignored (e.g. an inexistent lockscreen image when backing
  up) and were actually being reported to the user
- a bug when a “allow manager”/secure channel was refused as the beginning of the fw update
- a bug on the battery check UX that made the app re-navigate to the firmware update automatically
  once the user exited it
