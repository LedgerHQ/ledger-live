import type { BottomSheetProps } from "@ledgerhq/lumen-ui-rnative";
import type { BottomSheetBackgroundContextValue } from "../contexts/BottomSheetBackgroundContext";
import { useQueuedBottomSheetAdapters } from "../internals/adaptersContext";
import { useBottomSheetBackgroundToneRequests } from "../internals/useBottomSheetBackgroundToneRequests";

type UseBottomSheetBackgroundSurfaceReturn = Readonly<{
  /** Provide it around the content, as a `BottomSheetBackgroundContext`, to collect its tone. */
  backgroundContextValue: BottomSheetBackgroundContextValue;
  /** The app's background for the tone requested last, the one its sheets paint. */
  BackgroundComponent: BottomSheetProps["backgroundComponent"];
}>;

/**
 * The background a surface paints for the status tone its content requests with
 * `useBottomSheetBackgroundTone`: the queued sheets use it, and so can a surface that isn't a
 * sheet, e.g. a full screen, to paint the same background.
 */
export function useBottomSheetBackgroundSurface(): UseBottomSheetBackgroundSurfaceReturn {
  const adapters = useQueuedBottomSheetAdapters();
  const { backgroundTone, backgroundContextValue } = useBottomSheetBackgroundToneRequests();

  return {
    backgroundContextValue,
    BackgroundComponent: backgroundTone
      ? adapters.backgroundComponentByTone?.[backgroundTone]
      : undefined,
  };
}
