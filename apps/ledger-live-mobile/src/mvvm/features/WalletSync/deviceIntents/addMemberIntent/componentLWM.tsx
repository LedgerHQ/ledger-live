import React from "react";
import type { AddMemberJobState } from "@features/platform-intent-wallet-sync";
import { LedgerSyncJobStateLWM } from "../LedgerSyncJobStateLWM";

type AddMemberComponentLWMProps = Readonly<{
  jobState: AddMemberJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function AddMemberComponentLWM({ jobState, onClose }: AddMemberComponentLWMProps) {
  return (
    <LedgerSyncJobStateLWM jobState={jobState} onClose={onClose} testID="wallet-sync-add-member" />
  );
}
