import React from "react";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Step } from "~/renderer/reducers/walletSync";
import type { AnalyticsPage } from "../hooks/useLedgerSyncAnalytics";
import { useInitMemberCredentials } from "../hooks/useInitMemberCredentials";
import { AddMemberIntentStep } from "./addMemberIntent/AddMemberIntentStep";
import { RemoveMemberIntentStep } from "./removeMemberIntent/RemoveMemberIntentStep";

type LedgerSyncDeviceStepProps = Readonly<{
  step: Step;
  sourcePage: AnalyticsPage;
  member: TrustchainMember | null;
  onError: (error: Error) => void;
}>;

/**
 * Runs the DIE device step of the current Wallet Sync flow outside the side panel, which is
 * closed meanwhile: its dialog shows over the screen the flow started from.
 */
export function LedgerSyncDeviceStep({
  step,
  sourcePage,
  member,
  onError,
}: LedgerSyncDeviceStepProps) {
  // The panel, whose router initializes them, may never have opened (onboarding entry).
  useInitMemberCredentials();

  if (step === Step.DeviceActionInstance) {
    return <RemoveMemberIntentStep member={member} onError={onError} />;
  }
  return <AddMemberIntentStep sourcePage={sourcePage} onError={onError} />;
}
