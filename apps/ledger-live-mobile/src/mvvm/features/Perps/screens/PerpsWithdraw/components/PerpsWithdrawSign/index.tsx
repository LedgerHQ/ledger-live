import React from "react";
import { PerpsWithdrawSignView } from "./PerpsWithdrawSignView";
import {
  usePerpsWithdrawSignViewModel,
  type PerpsWithdrawSignProps,
} from "./usePerpsWithdrawSignViewModel";

export type { PerpsWithdrawSignProps } from "./usePerpsWithdrawSignViewModel";

export function PerpsWithdrawSign(props: PerpsWithdrawSignProps) {
  const viewModel = usePerpsWithdrawSignViewModel(props);
  return <PerpsWithdrawSignView {...viewModel} />;
}
