---
"live-mobile": patch
---

feat: QueueDrawer to queue drawers that should be displayed

`QueuedDrawer` replacing existing `BottomModal`. `QueuedDrawer` is a drawer taking into account the currently displayed drawer and other drawers waiting to be displayed.

This is made possible thanks to a queue of drawers waiting to be displayed. Once the currently displayed drawer is not displayed anymore (hidden), the next drawer in the queue is notified, and it updates its state to be make itself visible.

Also updated all the components consuming `BottomModal` and `BottomDrawer`
