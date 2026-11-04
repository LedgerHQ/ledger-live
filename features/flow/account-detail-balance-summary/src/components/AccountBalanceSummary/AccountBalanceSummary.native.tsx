import React from "react";
import { AccountBalanceSummaryView } from "./AccountBalanceSummaryView";
import type { AccountBalanceSummaryProps } from "./AccountBalanceSummary.types";
import { useAccountBalanceSummaryViewModel } from "./useAccountBalanceSummaryViewModel";

export const AccountBalanceSummary = (props: AccountBalanceSummaryProps) => (
  <AccountBalanceSummaryView {...useAccountBalanceSummaryViewModel(props)} />
);
