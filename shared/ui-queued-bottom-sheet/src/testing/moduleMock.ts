/**
 * Drop-in replacement for this package in native tests, for jest configs to point
 * `@shared/ui-queued-bottom-sheet` at through `moduleNameMapper`. The rename is the point: the
 * consumer keeps importing `QueuedBottomSheet` and gets the double.
 *
 * Only the sheet is replaced. A test that needs `QueuedBottomSheetsProvider`, the adapters or the
 * queue hooks — an app-level concern — should mock the module itself instead.
 */
export { QueuedBottomSheetMock as QueuedBottomSheet } from "./QueuedBottomSheetMock";
