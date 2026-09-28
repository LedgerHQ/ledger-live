import { useCallback, useMemo, useRef, useState } from "react";
import type { VerifyAddressProps } from "@features/flow-pay-request";

export const PAY_REQUEST_VERIFY_PAGE = "Request Address Verification";

export type PayVerifyOutcome =
  | "verified"
  | "cancelled"
  | "unsupported"
  | "mismatch"
  | "dismissed"
  | "initFailed";

export function usePayTabVerifyAddress(onMismatch?: () => void) {
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

  const verifyAddress = useMemo<VerifyAddressProps>(
    () => ({
      phase: introOpen ? "intro" : "hidden",
      page: PAY_REQUEST_VERIFY_PAGE,
      onVerify,
      onGotIt: onIntroDismiss,
      onClose: onIntroDismiss,
    }),
    [introOpen, onVerify, onIntroDismiss],
  );

  return {
    openIntro,
    verifyAddress,
    dieActive,
    onReady,
    onExit: finish,
  };
}
