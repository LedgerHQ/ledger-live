import type { BalanceItem } from "../components/AccountBalanceSummary/AccountBalanceSummary.types";

const MASK = "***";

export const displayValue = ({ value, sensitive = true }: BalanceItem, discreet: boolean) =>
  discreet && sensitive ? MASK : value;
