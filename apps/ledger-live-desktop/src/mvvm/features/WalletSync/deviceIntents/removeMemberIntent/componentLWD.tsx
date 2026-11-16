import React from "react";
import type { RemoveMemberJobState } from "@features/platform-intent-wallet-sync";
import { LedgerSyncJobStateLWD } from "../LedgerSyncJobStateLWD";

type RemoveMemberComponentLWDProps = Readonly<{
  jobState: RemoveMemberJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function RemoveMemberComponentLWD({ jobState, onClose }: RemoveMemberComponentLWDProps) {
  return (
    <LedgerSyncJobStateLWD
      jobState={jobState}
      onClose={onClose}
      testID="wallet-sync-remove-member"
    />
  );
}
