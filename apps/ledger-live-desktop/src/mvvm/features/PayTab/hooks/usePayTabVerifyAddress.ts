import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useFeature } from "@features/platform-feature-flags";
import type {
  PayRequestTrackEvent,
  VerifyAddressLabels,
  VerifyAddressPhase,
  VerifyAddressProps,
} from "@features/flow-pay-request";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";

const VERIFY_PAGE = "Request Address Verification";

/** Account (and optional parent) whose receive address is being verified. */
export type PayVerifySelection = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
}>;

/**
 * How the device flow ended. Everything but `mismatch` brings the receive
 * summary back; `mismatch` closes the whole flow because the reported address
 * must not be shared.
 */
export type PayVerifyOutcome =
  | "verified"
  | "cancelled"
  | "unsupported"
  | "mismatch"
  | "dismissed"
  | "initFailed";

/** Controls the app-side Device Intent Executor host for the verify flow. */
export type PayVerifyDeviceIntent = Readonly<{
  /** Whether the DIE should be mounted (only when `ldmkTransport` is on). */
  active: boolean;
  /** Selection to verify; `null` before the user starts. */
  selection: PayVerifySelection | null;
  /** Called once the executor dialog is actually showing, so the intro can step aside. */
  onReady: () => void;
  /** Called when the executor host leaves, with the outcome that drives navigation. */
  onExit: (outcome: PayVerifyOutcome) => void;
}>;

export type UsePayTabVerifyAddress = Readonly<{
  phase: VerifyAddressPhase;
  /** `onDone` runs when the user leaves the verify flow, to bring the receive summary back. */
  openIntro: (selection: PayVerifySelection, onDone?: () => void) => void;
  verifyAddress: VerifyAddressProps;
  deviceIntent: PayVerifyDeviceIntent;
}>;

/**
 * Owns the `hidden -> intro` phase of the Request VerifyAddress overlay and drives the on-device
 * verification. Once the device flow starts, the executor dialog owns the screen: it shows the
 * next steps as soon as the address reaches the Secure Screen, and closing it — on device
 * confirmation or on a user dismissal — comes back here.
 *
 * The whole DMK/DIE path is gated by the `ldmkTransport` feature flag (see `App.tsx` ->
 * `DeviceManagementKitProvider`): when the flag is off, `useDeviceManagementKit()` returns `null`
 * and mounting the DIE would immediately error. So the intro CTA branches:
 * - flag on  -> mount the shared `verifyAddressIntent` DIE (DMK-native per family + legacy
 *   fallback).
 * - flag off -> open the classic Receive modal, which verifies via the legacy transport.
 */
export function usePayTabVerifyAddress(
  onTrackEvent: PayRequestTrackEvent | undefined,
): UsePayTabVerifyAddress {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const ldmkTransport = useFeature("ldmkTransport");
  const [phase, setPhase] = useState<VerifyAddressPhase>("hidden");
  const [selection, setSelection] = useState<PayVerifySelection | null>(null);
  const [dieActive, setDieActive] = useState(false);
  const onDoneRef = useRef<(() => void) | undefined>(undefined);

  const openIntro = useCallback((nextSelection: PayVerifySelection, onDone?: () => void) => {
    setSelection(nextSelection);
    onDoneRef.current = onDone;
    setDieActive(false);
    setPhase("intro");
  }, []);

  /**
   * Leaves the verify flow. Idempotent: `onDone` is consumed at most once so a
   * device confirmation followed by the dialog unmount cannot restore the card
   * twice. `restore` is false only for `mismatch`, which must close everything.
   */
  const finish = useCallback((restore: boolean) => {
    setPhase("hidden");
    setDieActive(false);
    const onDone = onDoneRef.current;
    onDoneRef.current = undefined;
    if (restore) onDone?.();
  }, []);

  const onVerify = useCallback(() => {
    if (!selection) return;

    if (ldmkTransport?.enabled) {
      // Keep the intro visible until the executor dialog is actually up (onReady),
      // otherwise the PayTab shows a blank, clickable gap while the DIE initializes.
      setDieActive(true);
      return;
    }

    // Pure-legacy path: the classic Receive modal verifies via the legacy transport.
    // Bring the request card back behind it so the user returns to the summary on close.
    dispatch(
      openModal("MODAL_RECEIVE", {
        account: selection.account,
        parentAccount: selection.parentAccount ?? null,
      }),
    );
    finish(true);
  }, [selection, ldmkTransport, dispatch, finish]);

  // The executor dialog is up: step the intro aside so only one dialog is visible.
  const onReady = useCallback(() => setPhase("hidden"), []);

  const onExit = useCallback(
    (outcome: PayVerifyOutcome) => finish(outcome !== "mismatch"),
    [finish],
  );

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

  // Dismissing the intro (X / Escape / Got it) backs out to the request summary.
  const onIntroDismiss = useCallback(() => finish(true), [finish]);

  const verifyAddress = useMemo<VerifyAddressProps>(
    () => ({
      phase,
      labels,
      page: VERIFY_PAGE,
      onVerify,
      onGotIt: onIntroDismiss,
      onClose: onIntroDismiss,
      onTrackEvent,
    }),
    [phase, labels, onVerify, onIntroDismiss, onTrackEvent],
  );

  const deviceIntent = useMemo<PayVerifyDeviceIntent>(
    () => ({
      active: dieActive,
      selection,
      onReady,
      onExit,
    }),
    [dieActive, selection, onReady, onExit],
  );

  return { phase, openIntro, verifyAddress, deviceIntent };
}
