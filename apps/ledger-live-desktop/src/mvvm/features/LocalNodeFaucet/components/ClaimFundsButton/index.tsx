import React from "react";
import { ClaimFundsButtonView } from "./ClaimFundsButtonView";
import type { ClaimFundsButtonProps } from "./types";
import { useClaimFundsButtonViewModel } from "./useClaimFundsButtonViewModel";

/** Funds the account from coin-sandbox's airdrop server; shown only for a local node account. */
const ClaimFundsButton = (props: ClaimFundsButtonProps) => (
  <ClaimFundsButtonView {...useClaimFundsButtonViewModel(props)} />
);

export default ClaimFundsButton;
