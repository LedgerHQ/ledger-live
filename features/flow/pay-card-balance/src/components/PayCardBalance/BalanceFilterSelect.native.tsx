import React from "react";
import type { PayCardBalanceFilterOption } from "./types";
import { BalanceFilterSelectView } from "./BalanceFilterSelectView.native";
import { useBalanceFilterSelectViewModel } from "./useBalanceFilterSelectViewModel";

export type BalanceFilterSelectProps = Readonly<{
  allStablecoinsLabel: string;
  /** Applied option, or `undefined` when "all" is active. */
  selectedOption?: PayCardBalanceFilterOption;
  onOpenFilter: () => void;
}>;

export function BalanceFilterSelect(props: BalanceFilterSelectProps) {
  return <BalanceFilterSelectView {...useBalanceFilterSelectViewModel(props)} />;
}
