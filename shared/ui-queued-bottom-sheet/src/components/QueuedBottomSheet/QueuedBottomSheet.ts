// Default entry stub. The React Native bottom-sheet UI is not available outside RN;
// Metro resolves `QueuedBottomSheet.native` via platform extensions / moduleSuffixes.
import type { QueuedBottomSheetProps } from "./types";

export function QueuedBottomSheet(_props: QueuedBottomSheetProps): never {
  throw new Error(
    "@shared/ui-queued-bottom-sheet: QueuedBottomSheet is only available on React Native.",
  );
}
