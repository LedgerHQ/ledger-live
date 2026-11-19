import React from "react";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { StakePositionSignature } from "LLM/features/StakePosition/signature";
import {
  useExitTransactionViewModel,
  type ExitTransactionProps,
} from "./useExitTransactionViewModel";

export type {
  ExitTransactionProps,
  ExitTransactionStage,
  PreparedExit,
} from "./useExitTransactionViewModel";

/** The exit transaction of the position and its device step. Key it by the exit it prepares. */
export function ExitTransaction(props: ExitTransactionProps) {
  const { isSyncSkipped, signature } = useExitTransactionViewModel(props);

  return (
    <>
      {isSyncSkipped ? <SyncSkipUnderPriority priority={100} /> : null}
      {signature ? <StakePositionSignature {...signature} /> : null}
    </>
  );
}
