import { useCallback, useMemo, useRef, useState } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { PayVerifyOutcome, VerifyAddressProps } from "@features/flow-pay-request";

export type { PayVerifyOutcome };

export const PAY_REQUEST_VERIFY_PAGE = "Request Address Verification";

/** Account held from the moment verification starts, so a later sync cannot rebuild the device intent. */
export type PayVerifySelection = Readonly<{
  mainAccount: Account;
  tokenCurrency?: TokenCurrency;
}>;

export function usePayTabVerifyAddress(onMismatch?: () => void) {
  const [introOpen, setIntroOpen] = useState(false);
  const [dieActive, setDieActive] = useState(false);
  const [selection, setSelection] = useState<PayVerifySelection | null>(null);
  const introOpenRef = useRef(false);

  const setIntro = useCallback((open: boolean) => {
    introOpenRef.current = open;
    setIntroOpen(open);
  }, []);

  const openIntro = useCallback(
    (nextSelection: PayVerifySelection) => {
      if (dieActive) return;
      setSelection(nextSelection);
      setIntro(true);
    },
    [dieActive, setIntro],
  );

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
    selection,
    onReady,
    onExit: finish,
  };
}
