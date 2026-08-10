import type { BottomSheetProps } from "@ledgerhq/lumen-ui-rnative";
import type { BottomSheetBackgroundTone } from "./contexts/BottomSheetBackgroundContext";

/**
 * App-specific behaviour injected into the shared queued bottom sheet.
 *
 * Keeps this package free of Redux, React Navigation, and `libs/*`: the host app
 * supplies these implementations at its composition root via `QueuedBottomSheetsProvider`.
 *
 * `useAreBottomSheetsLocked` and `useIsScreenFocused` are React hooks — they run per sheet
 * during render, so pass a stable adapters object (module scope or `useMemo`).
 */
export type QueuedBottomSheetAdapters = Readonly<{
  /** Whether sheets are locked (e.g. during a device action): hides close, blocks backdrop. */
  useAreBottomSheetsLocked: () => boolean;
  /** Whether the sheet's owning screen is focused: unfocused screens close their sheets. */
  useIsScreenFocused: () => boolean;
  /** Maps a background tone to the sheet background component that paints it. */
  backgroundComponentByTone?: Partial<
    Record<BottomSheetBackgroundTone, NonNullable<BottomSheetProps["backgroundComponent"]>>
  >;
  /** Debug logger. */
  log: (message: string, data?: Record<string, unknown> | number | string) => void;
}>;

export const defaultQueuedBottomSheetAdapters: QueuedBottomSheetAdapters = {
  useAreBottomSheetsLocked: () => false,
  useIsScreenFocused: () => true,
  backgroundComponentByTone: undefined,
  log: () => {},
};
