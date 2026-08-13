import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { BottomSheetProps, useBottomSheetRef } from "@ledgerhq/lumen-ui-rnative";
import {
  BottomSheetInQueue,
  useQueuedBottomSheetContext,
} from "../contexts/QueuedBottomSheetsContext";
import { useQueuedBottomSheetAdapters } from "./adaptersContext";
import { useBottomSheetBackgroundToneRequests } from "./useBottomSheetBackgroundToneRequests";

interface UseQueuedBottomSheetProps {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onHeaderClosePressed?: () => void;
  onBackdropPress?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
}

type BottomSheetState = "idle" | "open" | "dismissing";

// QAA-1476 instrumentation. logDrawer emits no instance identifier, so lines from every drawer
// on screen interleave into one stream and cannot be attributed. Number each hook instance and
// prefix its output. Not for merge.
let instanceCounter = 0;

export function useQueuedBottomSheet({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onHeaderClosePressed,
  onBackdropPress,
  onModalHide,
  preventBackdropClick,
}: UseQueuedBottomSheetProps) {
  const adapters = useQueuedBottomSheetAdapters();
  const logRef = useRef(adapters.log);
  logRef.current = adapters.log;
  const instanceIdRef = useRef(0);
  if (instanceIdRef.current === 0) instanceIdRef.current = ++instanceCounter;
  const logBottomSheet = useCallback(
    (message: string, data?: Record<string, unknown> | number | string) =>
      logRef.current(`[#${instanceIdRef.current}] ${message}`, data),
    [],
  );

  const { backgroundTone, backgroundContextValue } = useBottomSheetBackgroundToneRequests();
  const { addBottomSheetToQueue } = useQueuedBottomSheetContext();
  const bottomSheetInQueueRef = useRef<BottomSheetInQueue | undefined>(undefined);
  const bottomSheetRef = useBottomSheetRef();
  const isFocused = adapters.useIsScreenFocused();
  const areBottomSheetsLocked = adapters.useAreBottomSheetsLocked();
  const backgroundComponent: BottomSheetProps["backgroundComponent"] = backgroundTone
    ? adapters.backgroundComponentByTone?.[backgroundTone]
    : undefined;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const onHeaderClosePressedRef = useRef(onHeaderClosePressed);
  onHeaderClosePressedRef.current = onHeaderClosePressed;

  const onBackdropPressRef = useRef(onBackdropPress);
  onBackdropPressRef.current = onBackdropPress;

  const onModalHideRef = useRef(onModalHide);
  onModalHideRef.current = onModalHide;

  const stateRef = useRef<BottomSheetState>("idle");

  // Bumped at the end of handleDismiss to re-trigger the open/close effect below. This defers
  // the "should we reopen?" decision to a React commit, ensuring any state update scheduled by
  // the consumer's onClose (from handleCloseAnimationStart) has been applied before we read
  // isRequestingToBeOpened — otherwise a fast backdrop dismiss could see a stale `true` and
  // re-enqueue the drawer.
  const [reopenCheckSignal, setReopenCheckSignal] = useState(0);

  const cleanupQueue = useCallback(() => {
    if (bottomSheetInQueueRef.current) {
      bottomSheetInQueueRef.current.removeBottomSheetFromQueue();
      bottomSheetInQueueRef.current = undefined;
    }
  }, []);

  const handleOpen = useCallback(() => {
    if (stateRef.current !== "idle") return;

    logBottomSheet("Opening drawer");
    stateRef.current = "open";
    bottomSheetRef.current?.present();
  }, [bottomSheetRef, logBottomSheet]);

  const handleClose = useCallback(() => {
    const state = stateRef.current;

    if (state === "idle") {
      cleanupQueue();
      return;
    }

    if (state === "dismissing") return;

    logBottomSheet("Closing drawer");
    stateRef.current = "dismissing";
    bottomSheetRef.current?.dismiss();
    onCloseRef.current?.();
  }, [bottomSheetRef, cleanupQueue, logBottomSheet]);

  // Adds this drawer to the queue. The queue decides when to actually open/close it via the
  // open/close state handlers.
  const enqueueBottomSheet = useCallback(() => {
    if (bottomSheetInQueueRef.current) return;

    bottomSheetInQueueRef.current = addBottomSheetToQueue(
      { open: handleOpen, close: handleClose },
      isForcingToBeOpened,
    );
  }, [addBottomSheetToQueue, handleOpen, handleClose, isForcingToBeOpened]);

  const handleUserClose = useCallback(() => {
    logBottomSheet("User initiated close");
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef, logBottomSheet]);

  // Notifies the consumer of the explicit backdrop press before dismissing. Unlike onClose
  // (which fires for any closing reason), this reflects a real user close interaction.
  const handleBackdropPress = useCallback(() => {
    logBottomSheet("Backdrop pressed");
    onBackdropPressRef.current?.();
    handleUserClose();
  }, [handleUserClose, logBottomSheet]);

  const handleHeaderClosePressed = useCallback(() => {
    if (stateRef.current === "dismissing") return;

    logBottomSheet("Header close pressed");
    stateRef.current = "dismissing";
    onHeaderClosePressedRef.current?.();
    onCloseRef.current?.();
  }, [logBottomSheet]);

  // Fired at the START of an animation. A close animation targets index -1, so this is the
  // earliest deterministic signal that the sheet is closing — for the X (close) button, the
  // backdrop and the pan-down gesture alike. We clear consumer state here rather than waiting for
  // onDismiss (which the X button defers until the close animation finishes). Otherwise a tap on
  // another trigger during the close window sets new state that the late onDismiss would wipe,
  // forcing the user to tap twice. Queue cleanup stays in onDismiss to preserve overlap protection.
  const handleCloseAnimationStart = useCallback(
    (_fromIndex: number, toIndex: number) => {
      if (toIndex === -1 && stateRef.current === "open") {
        logBottomSheet("Close animation started");
        stateRef.current = "dismissing";
        onCloseRef.current?.();
      }
    },
    [logBottomSheet],
  );

  const handleDismiss = useCallback(() => {
    logBottomSheet("BottomSheet dismissed (onDismiss)");

    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }

    // Fallback for dismissals that bypass the close animation (and thus handleCloseAnimationStart).
    if (stateRef.current === "open") {
      onCloseRef.current?.();
    }

    stateRef.current = "idle";
    cleanupQueue();
    onModalHideRef.current?.();

    // Defer the "should we reopen?" decision to the open/close effect below. Bumping the signal
    // forces a re-render; by the time the effect runs, React has committed any state update
    // scheduled by the consumer's onClose (called from handleCloseAnimationStart), so reading
    // isRequestingToBeOpened reflects the user's true intent — false for a normal backdrop close,
    // true only if the consumer genuinely re-requested while the sheet was closing.
    setReopenCheckSignal(s => s + 1);
  }, [cleanupQueue, logBottomSheet]);

  // QAA-1476 instrumentation: identify the consumer behind this instance. Callback names
  // usually survive minification well enough to point at the owning component, and the mount
  // order alone maps an id onto a drawer once you line it up with the test steps.
  useEffect(() => {
    logBottomSheet(
      `mounted: onClose=${onCloseRef.current?.name || "anon"} onModalHide=${onModalHideRef.current?.name || "anon"}`,
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // QAA-1476 instrumentation: the effect below closes the sheet from its cleanup, and React
  // re-runs that cleanup whenever any dependency changes. `isRequestingToBeOpened` is what
  // precedes every spurious close, so log the transition itself with the value, to separate
  // "the consumer withdrew the request" from "the hook closed and the consumer followed".
  // Computed during render so it is logged before the cleanup it explains. Not for merge.
  const prevDepsRef = useRef<Record<string, unknown> | null>(null);
  const currentDeps: Record<string, unknown> = {
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    handleClose,
    enqueueBottomSheet,
    logBottomSheet,
    reopenCheckSignal,
  };
  if (prevDepsRef.current) {
    const previous = prevDepsRef.current;
    const changed = Object.keys(currentDeps).filter(key => currentDeps[key] !== previous[key]);
    if (changed.length) {
      const state = `req=${isRequestingToBeOpened} forcing=${isForcingToBeOpened} focused=${isFocused} state=${stateRef.current}`;
      logBottomSheet(`deps changed: ${changed.join(", ")} | ${state}`);
    }
  }
  prevDepsRef.current = currentDeps;

  useEffect(() => {
    if (!isFocused && (isRequestingToBeOpened || isForcingToBeOpened)) {
      logBottomSheet("Closing drawer - screen not focused");
      handleClose();
      return;
    }

    if ((isRequestingToBeOpened || isForcingToBeOpened) && !bottomSheetInQueueRef.current) {
      enqueueBottomSheet();

      return () => {
        logBottomSheet("Effect cleanup - closing drawer");
        handleClose();
      };
    }
  }, [
    isFocused,
    isForcingToBeOpened,
    isRequestingToBeOpened,
    handleClose,
    enqueueBottomSheet,
    logBottomSheet,
    reopenCheckSignal,
  ]);

  useEffect(() => {
    return () => {
      logBottomSheet("Component unmounting - cleaning up");
      cleanupQueue();
    };
  }, [cleanupQueue, logBottomSheet]);

  return {
    bottomSheetRef,
    areBottomSheetsLocked,
    handleUserClose,
    handleBackdropPress,
    handleHeaderClosePressed,
    handleDismiss,
    handleCloseAnimationStart,
    onBack,
    enablePanDownToClose: !areBottomSheetsLocked && !preventBackdropClick,
    backgroundContextValue,
    backgroundComponent,
  };
}
