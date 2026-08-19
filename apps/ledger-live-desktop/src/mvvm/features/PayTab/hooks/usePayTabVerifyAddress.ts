import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  PayCardTrackEvent,
  VerifyAddressLabels,
  VerifyAddressPhase,
  VerifyAddressProps,
} from "@features/flow-pay-card-request";

const VERIFY_PAGE = "Request Address Verification";

export type UsePayTabVerifyAddress = Readonly<{
  phase: VerifyAddressPhase;
  openIntro: () => void;
  showSuccess: () => void;
  verifyAddress: VerifyAddressProps;
}>;

/**
 * Owns the `hidden -> intro -> success` phase of the Request VerifyAddress overlay and resolves its
 * copy.
 *
 * UI-only for now: the intro CTA advances straight to the success screen. Once the shared
 * `verifyAddressIntent` lands (LIVE-36132), the CTA will instead start the device intent and the
 * app's DIE host will render the executing phase and call `showSuccess` on device confirmation.
 */
export function usePayTabVerifyAddress(
  onTrackEvent: PayCardTrackEvent | undefined,
): UsePayTabVerifyAddress {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<VerifyAddressPhase>("hidden");

  const openIntro = useCallback(() => setPhase("intro"), []);
  const showSuccess = useCallback(() => setPhase("success"), []);
  const close = useCallback(() => setPhase("hidden"), []);

  const onVerify = showSuccess;

  const labels = useMemo<VerifyAddressLabels>(
    () => ({
      introTitle: t("payTab.request.verifyAddress.introTitle"),
      introDescription: t("payTab.request.verifyAddress.introDescription"),
      verifyCta: t("payTab.request.verifyAddress.verifyCta"),
      successTitle: t("payTab.request.verifyAddress.successTitle"),
      nextStepsLabel: t("payTab.request.verifyAddress.nextStepsLabel"),
      nextStepShare: t("payTab.request.verifyAddress.nextStepShare"),
      nextStepMatch: t("payTab.request.verifyAddress.nextStepMatch"),
      gotItCta: t("payTab.request.verifyAddress.gotItCta"),
    }),
    [t],
  );

  const verifyAddress = useMemo<VerifyAddressProps>(
    () => ({
      phase,
      labels,
      page: VERIFY_PAGE,
      onVerify,
      onGotIt: close,
      onClose: close,
      onTrackEvent,
    }),
    [phase, labels, onVerify, close, onTrackEvent],
  );

  return { phase, openIntro, showSuccess, verifyAddress };
}
