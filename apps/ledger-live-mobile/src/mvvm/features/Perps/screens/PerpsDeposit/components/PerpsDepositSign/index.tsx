import React from "react";
import { PerpsDepositSignView } from "./PerpsDepositSignView";
import {
  usePerpsDepositSignViewModel,
  type PerpsDepositSignProps,
} from "./usePerpsDepositSignViewModel";

export type { PerpsDepositSignProps } from "./usePerpsDepositSignViewModel";

export function PerpsDepositSign(props: PerpsDepositSignProps) {
  const viewModel = usePerpsDepositSignViewModel(props);
  return <PerpsDepositSignView {...viewModel} />;
}
