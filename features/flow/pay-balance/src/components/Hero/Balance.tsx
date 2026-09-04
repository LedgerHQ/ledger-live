import React from "react";
import { BalanceView } from "./BalanceView";
import type { BalanceProps } from "../../types";
import { useBalanceViewModel } from "./useBalanceViewModel";

export function Balance(props: BalanceProps) {
  return <BalanceView {...useBalanceViewModel(props)} />;
}
