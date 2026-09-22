---
"@shared/ui-queued-bottom-sheet": minor
"live-mobile": minor
---

Fix the blank sheet that could appear when adding contacts one after another on iOS. A sheet is now dismissed once per presentation, and a dismissal nobody asked for puts the sheet back on screen instead of hiding the content of the presentation the user has just opened. A sheet that reaches the screen after being considered closed is dismissed once it animates, which is the point gorhom stops ignoring the request.
