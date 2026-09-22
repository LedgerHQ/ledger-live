import { useCallback, useMemo } from "react";
import type {
  VerifyAddressNextStep,
  VerifyAddressProps,
  VerifyAddressViewModel,
} from "../../types";

const TRACK_LOCATION = "verify address";

export function useVerifyAddressViewModel({
  phase,
  labels,
  page,
  onVerify,
  onGotIt,
  onClose,
  onTrackEvent,
}: VerifyAddressProps): VerifyAddressViewModel {
  const nextSteps = useMemo<readonly VerifyAddressNextStep[]>(
    () => [
      { index: 1, label: labels.nextStepShare },
      { index: 2, label: labels.nextStepMatch },
    ],
    [labels],
  );

  const handleVerify = useCallback(() => {
    onTrackEvent?.("button_clicked", {
      button: "verify",
      buttonLocation: TRACK_LOCATION,
      page,
      flow: "request",
    });
    onVerify();
  }, [onVerify, onTrackEvent, page]);

  const handleGotIt = useCallback(() => {
    onTrackEvent?.("button_clicked", {
      button: "got it",
      buttonLocation: TRACK_LOCATION,
      page,
      flow: "request",
    });
    onGotIt();
  }, [onGotIt, onTrackEvent, page]);

  return {
    isIntroOpen: phase === "intro",
    isSuccessOpen: phase === "success",
    nextSteps,
    onVerify: handleVerify,
    onGotIt: handleGotIt,
    onClose,
  };
}
