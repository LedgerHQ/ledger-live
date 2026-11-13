import { useCallback, useEffect, useRef } from "react";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { track } from "@shared/analytics";
import type { VerifyAddressOutcome, VerifyAddressTracking } from "../types";

type ReachedOutcome = Extract<
  VerifyAddressOutcome,
  "verified" | "cancelled" | "mismatch" | "unsupported"
>;

type TrackedOutcome = ReachedOutcome | "dismissed";

const VERIFICATION_PAGE = { page: "Receive Address Verification", flow: "receive" } as const;

const OUTCOME_EVENT: Record<TrackedOutcome, string> = {
  verified: "receive_verification_complete",
  cancelled: "receive_verification_cancelled",
  mismatch: "receive_verification_mismatch",
  unsupported: "receive_verification_unsupported",
  dismissed: "receive_verification_dismiss",
};

function reachedOutcome(jobState: VerifyAddressIntentJobState): ReachedOutcome | undefined {
  switch (jobState.type) {
    case "verified":
    case "cancelled":
    case "mismatch":
    case "unsupported":
      return jobState.type;
    case "verifying":
    case "addressDisplayed":
      return undefined;
  }
}

export type UseVerifyAddressSessionParams = Readonly<{
  /** Absent until the device verification is ready to mount. */
  tracking: VerifyAddressTracking | undefined;
  onExit: (outcome: VerifyAddressOutcome) => void;
}>;

export type VerifyAddressSession = Readonly<{
  /** Calls `onExit` once, whatever calls it next. */
  exit: (outcome: VerifyAddressOutcome) => void;
  onJobStateChanged: (jobState: VerifyAddressIntentJobState) => void;
  /** The user left: with the outcome reached so far, or `dismissed` before any. */
  onUserCancel: () => void;
}>;

/** Tracks a receive address verification and reports how it ended. */
export function useVerifyAddressSession({
  tracking,
  onExit,
}: UseVerifyAddressSessionParams): VerifyAddressSession {
  const reachedOutcomeRef = useRef<ReachedOutcome | undefined>(undefined);
  const exitedRef = useRef(false);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  const exit = useCallback((outcome: VerifyAddressOutcome) => {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onExitRef.current(outcome);
  }, []);

  const trackOutcome = useCallback(
    (outcome: TrackedOutcome) => {
      void track(OUTCOME_EVENT[outcome], { ...VERIFICATION_PAGE, ...tracking });
    },
    [tracking],
  );

  const onJobStateChanged = useCallback(
    (jobState: VerifyAddressIntentJobState) => {
      if (exitedRef.current) return;
      const outcome = reachedOutcome(jobState);
      reachedOutcomeRef.current = outcome;
      if (outcome) trackOutcome(outcome);
    },
    [trackOutcome],
  );

  const onUserCancel = useCallback(() => {
    if (exitedRef.current) return;
    const outcome = reachedOutcomeRef.current ?? "dismissed";
    if (outcome === "dismissed") trackOutcome(outcome);
    exit(outcome);
  }, [exit, trackOutcome]);

  return { exit, onJobStateChanged, onUserCancel };
}
