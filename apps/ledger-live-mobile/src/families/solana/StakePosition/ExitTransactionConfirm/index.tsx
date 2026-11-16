import React from "react";
import { StakePositionConfirm } from "@features/flow-stake-position";
import TranslatedError from "~/components/TranslatedError";
import {
  useExitTransactionConfirmViewModel,
  type ExitTransactionConfirmProps,
} from "./useExitTransactionConfirmViewModel";

/** The confirmation of the exit, with its transaction prepared and checked by the bridge. */
export function ExitTransactionConfirm(props: ExitTransactionConfirmProps) {
  const { error, ...confirm } = useExitTransactionConfirmViewModel(props);

  return (
    <StakePositionConfirm
      {...confirm}
      errorContent={error ? <TranslatedError error={error} /> : undefined}
    />
  );
}
