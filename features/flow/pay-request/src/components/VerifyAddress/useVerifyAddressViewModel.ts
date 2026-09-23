import { useCallback, useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type {
  VerifyAddressNextStep,
  VerifyAddressProps,
  VerifyAddressViewModel,
} from "../../types";

const TRACK_LOCATION = "verify address";
const KEY_PREFIX = "payTab.request.verifyAddress";

export function useVerifyAddressViewModel({
  phase,
  page,
  onVerify,
  onGotIt,
  onClose,
  onTrackEvent,
}: VerifyAddressProps): VerifyAddressViewModel {
  const { t } = useTranslation();

  const nextSteps = useMemo<readonly VerifyAddressNextStep[]>(
    () => [
      { index: 1, label: t(`${KEY_PREFIX}.nextStepShare`) },
      { index: 2, label: t(`${KEY_PREFIX}.nextStepMatch`) },
    ],
    [t],
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
    introTitle: t(`${KEY_PREFIX}.introTitle`),
    introDescription: t(`${KEY_PREFIX}.introDescription`),
    verifyCta: t(`${KEY_PREFIX}.verifyCta`),
    successTitle: t(`${KEY_PREFIX}.successTitle`),
    nextStepsLabel: t(`${KEY_PREFIX}.nextStepsLabel`),
    nextSteps,
    gotItCta: t(`${KEY_PREFIX}.gotItCta`),
    onVerify: handleVerify,
    onGotIt: handleGotIt,
    onClose,
  };
}
