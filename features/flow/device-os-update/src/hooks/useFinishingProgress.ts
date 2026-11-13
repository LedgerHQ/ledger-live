import { useCallback, useState } from "react";

export type ProgressDisplay = Readonly<{
  progress: number;
  isRestoring: boolean;
  /** Only known while updating. */
  update?: Readonly<{ index: number; count: number }>;
}>;

export type FinishingProgressInput = Readonly<{
  /** What the current state shows as progress, when it is a progress state. */
  display: ProgressDisplay | undefined;
  /** The state that replaces the progress screen with the success screen is current. */
  isDone: boolean;
}>;

export type FinishingProgress = Readonly<{
  /** The last progress screen shown, to be rendered at 100% starting from `from`. */
  display: ProgressDisplay;
  from: number;
  /** To call once the bar has reached 100%. */
  onFinished: () => void;
}>;

const isSameDisplay = (a: ProgressDisplay | undefined, b: ProgressDisplay | undefined) =>
  a?.progress === b?.progress &&
  a?.isRestoring === b?.isRestoring &&
  a?.update?.index === b?.update?.index &&
  a?.update?.count === b?.update?.count;

export type FinishingProgressResult = Readonly<{
  /** The last progress shown, whatever the current state is, once there is one. */
  lastDisplay: ProgressDisplay | undefined;
  /** Set while the bar has to fill up before the success screen. */
  finishing: FinishingProgress | undefined;
}>;

/**
 * The orchestrator reports the end of a step right after its last progress value, which can leave
 * the bar short of 100% (the restore share when no backup is restored, for instance). Remembers the
 * last progress shown so the bar can fill up before the success screen replaces it.
 *
 * `finishing` is `undefined` when there is nothing to fill: the step is not done, the bar was already
 * full, or no progress was ever shown. `lastDisplay` lets the screen keep the bar where it was while
 * a sheet states something other than progress.
 */
export function useFinishingProgress({
  display,
  isDone,
}: FinishingProgressInput): FinishingProgressResult {
  const [lastDisplay, setLastDisplay] = useState<ProgressDisplay | undefined>(display);
  const [hasFinished, setHasFinished] = useState(false);

  // Derived while rendering rather than in an effect, so the screen never shows a stale value.
  if (display && !isSameDisplay(display, lastDisplay)) setLastDisplay(display);

  const onFinished = useCallback(() => {
    // Ignores the end of the animations of the regular progress ticks.
    if (isDone) setHasFinished(true);
  }, [isDone]);

  if (!isDone || hasFinished || !lastDisplay || lastDisplay.progress >= 1) {
    return { lastDisplay, finishing: undefined };
  }

  return {
    lastDisplay,
    finishing: { display: lastDisplay, from: lastDisplay.progress, onFinished },
  };
}
