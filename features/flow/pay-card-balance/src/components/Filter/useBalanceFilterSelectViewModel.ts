import type { BalanceFilterOption } from "../../types";

export type BalanceFilterSelectViewModelParams = Readonly<{
  allStablecoinsLabel: string;
  /** Applied option, or `undefined` when "all" is active. */
  selectedOption?: BalanceFilterOption;
  onOpenFilter: () => void;
}>;

export type BalanceFilterSelectViewModel = Readonly<{
  label: string;
  /** Ledger currency id for the leading crypto icon. Absent for the "all" row. */
  ledgerId?: string;
  ticker?: string;
  onPress: () => void;
}>;

export function useBalanceFilterSelectViewModel({
  allStablecoinsLabel,
  selectedOption,
  onOpenFilter,
}: BalanceFilterSelectViewModelParams): BalanceFilterSelectViewModel {
  return {
    label: selectedOption?.ticker ?? selectedOption?.title ?? allStablecoinsLabel,
    ledgerId: selectedOption?.ledgerId,
    ticker: selectedOption?.ticker,
    onPress: onOpenFilter,
  };
}
