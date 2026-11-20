/**
 * Drop-in replacement for this package in native tests, for jest configs to point
 * `@shared/ui-queued-bottom-sheet` at through `moduleNameMapper`. The rename is the point: the
 * consumer keeps importing `QueuedBottomSheet` and gets the double.
 *
 * Only the sheet is replaced. The queue, its provider and the background surface are the real ones,
 * so a view that takes its turn in the queue without being a sheet (e.g. a full screen) works too.
 */
export { QueuedBottomSheetMock as QueuedBottomSheet } from "./QueuedBottomSheetMock";
export { BottomSheetBackgroundContext } from "../contexts/BottomSheetBackgroundContext";
// The double renders no background, so the real hook is a no-op here: descendants that tint the
// sheet keep rendering instead of crashing on a missing export.
export { useBottomSheetBackgroundTone } from "../hooks/useBottomSheetBackgroundTone";
// The double is not a gorhom sheet, so there is no keyboard state to register a field with.
export { useBottomSheetKeyboardAwareInputMock as useBottomSheetKeyboardAwareInput } from "./useBottomSheetKeyboardAwareInputMock";
// The double renders the footer inline with the content, so nothing has to be reserved for it.
export { useBottomSheetFooterInset } from "../contexts/BottomSheetFooterInsetContext";
export { useBottomSheetBottomInset } from "../contexts/BottomSheetBottomInsetContext";
// Real queue: none of it needs gorhom.
export { QueuedBottomSheetsProvider } from "../components/QueuedBottomSheetsProvider/QueuedBottomSheetsProvider";
export { useQueuedBottomSheetContext } from "../contexts/QueuedBottomSheetsContext";
export { useBottomSheetBackgroundSurface } from "../hooks/useBottomSheetBackgroundSurface";
export { useQueuedBottomSheetTurn } from "../hooks/useQueuedBottomSheetTurn";
