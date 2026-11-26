import React from "react";
import type { AddMemberJobState } from "@features/platform-key-ring";
import { LedgerSyncJobStateLWD } from "../LedgerSyncJobStateLWD";

type AddMemberComponentLWDProps = Readonly<{
  jobState: AddMemberJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function AddMemberComponentLWD({ jobState, onClose }: AddMemberComponentLWDProps) {
  return (
    <LedgerSyncJobStateLWD jobState={jobState} onClose={onClose} testID="wallet-sync-add-member" />
  );
}
