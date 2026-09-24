---
"@shared/ui-queued-bottom-sheet": minor
"@features/flow-pay-card-assets": patch
"@features/flow-pay-card-details": patch
"live-mobile": patch
---

Fix drag-and-drop reordering in the card's manage-assets sheet, which never got the gesture

- `QueuedBottomSheet` takes `enableContentPanningGesture`, so content that owns a drag gesture can stop the sheet's own pan from claiming it.
- The manage-assets scene turns that gesture off and its list is no longer scrollable, leaving the drag uncontested and letting the sheet size to its rows.
- The row being dragged takes a `surfacePressed` background.
