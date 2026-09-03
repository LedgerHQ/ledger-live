import { useCallback, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  PayRequestTrackEvent,
  VerifyAddressLabels,
  VerifyAddressProps,
} from "@features/flow-pay-request";
import { useTranslation } from "@shared/i18n";

export const PAY_REQUEST_VERIFY_PAGE = "Request Address Verification";

export type PayVerifyOutcome =
  | "verified"
  | "cancelled"
  | "unsupported"
  | "mismatch"
  | "dismissed"
  | "initFailed";

export function usePayTabVerifyAddress(
  onTrackEvent?: PayRequestTrackEvent,
  onMismatch?: () => void,
) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [introOpen, setIntroOpen] = useState(false);
  const [dieActive, setDieActive] = useState(false);
  const introOpenRef = useRef(false);

  const setIntro = useCallback((open: boolean) => {
    introOpenRef.current = open;
    setIntroOpen(open);
  }, []);

  const openIntro = useCallback(() => {
    if (dieActive) return;
    setIntro(true);
  }, [dieActive, setIntro]);

  const finish = useCallback(
    (outcome: PayVerifyOutcome) => {
      setIntro(false);
      setDieActive(false);
      if (outcome === "mismatch") {
        onMismatch?.();
      }
    },
    [onMismatch, setIntro],
  );

  const onVerify = useCallback(() => setDieActive(true), []);
  const onReady = useCallback(() => setIntro(false), [setIntro]);

  const onIntroDismiss = useCallback(() => {
    if (!introOpenRef.current) return;
    finish("dismissed");
  }, [finish]);

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
      phase: introOpen ? "intro" : "hidden",
      labels,
      page: PAY_REQUEST_VERIFY_PAGE,
      onVerify,
      onGotIt: onIntroDismiss,
      onClose: onIntroDismiss,
      onTrackEvent,
      bottomInset,
    }),
    [introOpen, labels, onVerify, onIntroDismiss, onTrackEvent, bottomInset],
  );

  return {
    openIntro,
    verifyAddress,
    dieActive,
    onReady,
    onExit: finish,
  };
}
