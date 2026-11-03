import React from "react";
import AccountDetailBalanceSummary from "../AccountDetailBalanceSummary";
import AccountDetailDelegations from "../AccountDetailDelegations";
import type { AccountDetailSectionViewModel } from "./useAccountDetailSectionViewModel";

export const AccountDetailSectionView = ({
  account,
  showBalanceSummary,
  showDelegations,
}: AccountDetailSectionViewModel) => (
  <>
    {showBalanceSummary ? <AccountDetailBalanceSummary account={account} /> : null}
    {showDelegations ? <AccountDetailDelegations account={account} /> : null}
  </>
);
