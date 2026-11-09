import React from "react";
import type { RemoveMemberJobState } from "@features/platform-intent-wallet-sync";
import { LedgerSyncJobStateLWM } from "../LedgerSyncJobStateLWM";

type RemoveMemberComponentLWMProps = Readonly<{
  jobState: RemoveMemberJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function RemoveMemberComponentLWM({ jobState, onClose }: RemoveMemberComponentLWMProps) {
  return (
    <LedgerSyncJobStateLWM
      jobState={jobState}
      onClose={onClose}
      testID="wallet-sync-remove-member"
    />
  );
}
