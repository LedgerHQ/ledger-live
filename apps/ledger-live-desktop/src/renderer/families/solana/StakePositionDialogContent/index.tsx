import React from "react";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { StakePositionDialogContentProps } from "../../types";
import { StakePositionDialogContentView } from "./StakePositionDialogContentView";
import { useSolanaStakePositionDialogViewModel } from "./useSolanaStakePositionDialogViewModel";

const StakePositionDialogContent = (props: StakePositionDialogContentProps<SolanaAccount>) => (
  <StakePositionDialogContentView {...useSolanaStakePositionDialogViewModel(props)} />
);

export default StakePositionDialogContent;
