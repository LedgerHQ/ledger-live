import { useCallback, useEffect, useMemo, useRef } from "react";
import type { VerifyAddressIntentResult } from "@features/platform-intent-verify-address";
import { track } from "@shared/analytics";
import type {
  VerifyAddressDeviceFlowFailure,
  VerifyAddressOutcome,
  VerifyAddressTracking,
} from "../types";

type ResultOutcome = Extract<
  VerifyAddressOutcome,
  "verified" | "cancelled" | "mismatch" | "unsupported"
>;

/** The device's other answers come after the user could already go back: they are not tracked. */
type TrackedOutcome = "unsupported" | "dismissed";

type EarlyOutcome = Extract<VerifyAddressOutcome, "unsupported" | "failed">;

const VERIFICATION_PAGE = { page: "Receive Address Verification", flow: "receive" } as const;

const OUTCOME_EVENT: Record<TrackedOutcome, string> = {
  unsupported: "receive_verification_unsupported",
  dismissed: "receive_verification_dismiss",
};

const RESULT_OUTCOME: Record<VerifyAddressIntentResult["type"], ResultOutcome> = {
  verified: "verified",
  refused: "cancelled",
  mismatch: "mismatch",
  unsupported: "unsupported",
};

export type UseVerifyAddressSessionParams = Readonly<{
  /** Absent until the asset and network are known. */
  tracking: VerifyAddressTracking | undefined;
  onExit: (outcome: VerifyAddressOutcome) => void;
}>;

export type VerifyAddressSession = Readonly<{
  /** Ends the verification before the device: `unsupported` sends its event, `failed` none. */
  exitEarly: (outcome: EarlyOutcome, tracking?: VerifyAddressTracking) => void;
  /** Each device request of the job, retries included: forgets the refusal and the job error. */
  onAttemptStart: () => void;
  /** The device shows the address: leaving now goes back to it, whatever the device answers. */
  onAddressDisplayed: () => void;
  onResult: (result: VerifyAddressIntentResult) => void;
  onJobError: () => void;
  /** The executor's `onUserCancel`, with the error screen the user closed, if any. */
  onUserCancel: (failure?: VerifyAddressDeviceFlowFailure | null) => void;
}>;

/** Tracks a receive address verification and reports how it ended, once. */
export function useVerifyAddressSession({
  tracking,
  onExit,
}: UseVerifyAddressSessionParams): VerifyAddressSession {
  const resultOutcomeRef = useRef<ResultOutcome | undefined>(undefined);
  const jobFailedRef = useRef(false);
  const addressDisplayedRef = useRef(false);
  const exitedRef = useRef(false);
  const onExitRef = useRef(onExit);
  const trackingRef = useRef(tracking);

  useEffect(() => {
    onExitRef.current = onExit;
    trackingRef.current = tracking;
  }, [onExit, tracking]);

  const trackOutcome = useCallback(
    (outcome: TrackedOutcome, outcomeTracking = trackingRef.current) => {
      void track(OUTCOME_EVENT[outcome], { ...VERIFICATION_PAGE, ...outcomeTracking });
    },
    [],
  );

  const exit = useCallback((outcome: VerifyAddressOutcome) => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onExitRef.current(outcome);
  }, []);

  const exitEarly = useCallback(
    (outcome: EarlyOutcome, earlyTracking?: VerifyAddressTracking) => {
      if (exitedRef.current) return;
      if (outcome === "unsupported") trackOutcome(outcome, earlyTracking);
      exit(outcome);
    },
    [exit, trackOutcome],
  );

  const onResult = useCallback(
    (result: VerifyAddressIntentResult) => {
      const previousOutcome = resultOutcomeRef.current;
      if (exitedRef.current || (previousOutcome && previousOutcome !== "cancelled")) return;
      const outcome = RESULT_OUTCOME[result.type];
      resultOutcomeRef.current = outcome;
      if (outcome === "unsupported") trackOutcome(outcome);
    },
    [trackOutcome],
  );

  const onAttemptStart = useCallback(() => {
    if (resultOutcomeRef.current === "cancelled") resultOutcomeRef.current = undefined;
    jobFailedRef.current = false;
    addressDisplayedRef.current = false;
  }, []);

  const onAddressDisplayed = useCallback(() => {
    addressDisplayedRef.current = true;
  }, []);

  const onJobError = useCallback(() => {
    jobFailedRef.current = true;
  }, []);

  const outcomeOnLeave = useCallback(
    (failure: VerifyAddressDeviceFlowFailure | null | undefined): VerifyAddressOutcome => {
      const resultOutcome = resultOutcomeRef.current;
      if (resultOutcome === "mismatch" || resultOutcome === "unsupported") return resultOutcome;
      if (resultOutcome === "verified")
        return addressDisplayedRef.current ? "displayed" : resultOutcome;
      if (failure?.countsAsFailure || jobFailedRef.current) return "failed";
      if (addressDisplayedRef.current) return "displayed";
      if (resultOutcome) return resultOutcome;
      trackOutcome("dismissed");
      return "dismissed";
    },
    [trackOutcome],
  );

  const onUserCancel = useCallback(
    (failure?: VerifyAddressDeviceFlowFailure | null) => {
      if (exitedRef.current) return;
      exit(outcomeOnLeave(failure));
    },
    [exit, outcomeOnLeave],
  );

  return useMemo(
    () => ({ exitEarly, onAttemptStart, onAddressDisplayed, onResult, onJobError, onUserCancel }),
    [exitEarly, onAttemptStart, onAddressDisplayed, onResult, onJobError, onUserCancel],
  );
}
