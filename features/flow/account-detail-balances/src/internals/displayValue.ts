import type { BalanceItem } from "../components/AccountBalances/AccountBalances.types";

const MASK = "***";

export const displayValue = ({ value, sensitive = true }: BalanceItem, discreet: boolean) =>
  discreet && sensitive ? MASK : value;
