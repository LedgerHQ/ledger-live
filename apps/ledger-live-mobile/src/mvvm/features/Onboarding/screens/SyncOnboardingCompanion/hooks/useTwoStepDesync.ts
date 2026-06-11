import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Constants
 */
export const NORMAL_DESYNC_OVERLAY_DISPLAY_DELAY_MS = 10000;
const NORMAL_DESYNC_TIMEOUT_MS = 60000;
const LONG_DESYNC_TIMEOUT_MS = 120000;
const LONG_DESYNC_OVERLAY_DISPLAY_DELAY_MS = 60000;

interface UseTwoStepDesyncProps {
  /**
   * Called when the polling from the companion component has definitely lost/is desync with the device
   */
  onLostDevice: () => void;
  /**
   * Called when the companion is displaying an alert message that should overlay
   * all the screen, including the header
   */
  onShouldHeaderBeOverlaid: (shouldBeOverlaid: boolean) => void;
  /**
   * Updates any existing delay before displaying the hiding the header below an overlay
   */
  updateHeaderOverlayDelay: (delayMs: number) => void;
  setIsPollingOn: (isPolling: boolean) => void;
}

/*
 * Controls the desync drawer overlay
 */
const useTwoStepDesync = ({
  onLostDevice,
  onShouldHeaderBeOverlaid,
  updateHeaderOverlayDelay,
  setIsPollingOn,
}: UseTwoStepDesyncProps) => {
  const [isDesyncOverlayOpen, setIsDesyncOverlayOpen] = useState<boolean>(false);
  const [desyncOverlayDisplayDelayMs, setDesyncOverlayDisplayDelayMs] = useState<number>(
    NORMAL_DESYNC_OVERLAY_DISPLAY_DELAY_MS,
  );
  const [desyncTimeoutMs, setDesyncTimeoutMs] = useState<number>(NORMAL_DESYNC_TIMEOUT_MS);

  const desyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Callbacks
   */
  const handleDesyncTimedOut = useCallback(() => {
    onShouldHeaderBeOverlaid(false);
    setIsDesyncOverlayOpen(false);
    onLostDevice();

    setIsPollingOn(false);
  }, [onShouldHeaderBeOverlaid, onLostDevice, setIsPollingOn]);

  // Reacts to allowedError from the polling to set or clean the desync timeout
  // Needs to be used in a useEffect to handle incoming errors
  const handlePollingError = useCallback(
    (allowedError: Error | null) => {
      if (allowedError) {
        desyncTimerRef.current = setTimeout(handleDesyncTimedOut, desyncTimeoutMs);

        // Displays an overlay to alert the user. This overlay should also hide the screen header
        setIsDesyncOverlayOpen(true);
        onShouldHeaderBeOverlaid(true);
      } else if (!allowedError) {
        // desyncTimer is cleared in the useEffect cleanup function
        setIsDesyncOverlayOpen(false);
        onShouldHeaderBeOverlaid(false);
      }

      return () => {
        if (desyncTimerRef.current) {
          clearTimeout(desyncTimerRef.current);
          desyncTimerRef.current = null;
        }
      };
    },
    [handleDesyncTimedOut, desyncTimeoutMs, onShouldHeaderBeOverlaid],
  );

  const handleSeedGenerationDelay = useCallback(() => {
    setDesyncOverlayDisplayDelayMs(LONG_DESYNC_OVERLAY_DISPLAY_DELAY_MS);
    updateHeaderOverlayDelay(LONG_DESYNC_OVERLAY_DISPLAY_DELAY_MS);
    setDesyncTimeoutMs(LONG_DESYNC_TIMEOUT_MS);
  }, [updateHeaderOverlayDelay, setDesyncTimeoutMs, setDesyncOverlayDisplayDelayMs]);

  /*
   * useEffects
   */

  // Cleanup for any handlePollingError side effects
  useEffect(() => {
    return () => {
      // Note if you update `allowedError`: `allowedError` needs to stay stable,
      // and not change its reference if the error is the same to avoid resetting the timer
      if (desyncTimerRef.current) {
        clearTimeout(desyncTimerRef.current);
        desyncTimerRef.current = null;
      }
    };
  }, [handleDesyncTimedOut, desyncTimeoutMs, onShouldHeaderBeOverlaid]);

  return {
    isDesyncOverlayOpen,
    desyncOverlayDisplayDelayMs,
    handlePollingError,
    handleSeedGenerationDelay,
  };
};

export default useTwoStepDesync;
