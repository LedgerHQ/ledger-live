---
"live-mobile": patch
---

Move the Lumen `QueuedBottomSheet` into `@shared/ui-queued-bottom-sheet` (app couplings injected as adapters) so DDD feature packages can consume a queue-aware bottom sheet. Queue APIs use bottom-sheet naming (`QueuedBottomSheetsProvider`, `addBottomSheetToQueue`, …). Legacy `QueuedDrawer` stays in the app. No behaviour change.
