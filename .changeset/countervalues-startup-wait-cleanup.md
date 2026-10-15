---
"live-mobile": minor
---

Release the countervalues startup wait's timer and store subscription once it ends

The countervalues loop starts when the currencies are hydrated and the remote flags are ready, or
after a second at most. The two sides raced as separate promises, so whichever lost kept running:
the remote flags subscription stayed registered until the first fetch settled, and the timer fired
for nothing when the app was ready first. One wait now owns both and releases both as soon as it
settles. The loop starts at the same moment as before.
