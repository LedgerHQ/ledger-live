import type { DelegationCell } from "../components/AccountDelegations/AccountDelegations.types";

const MASK = "***";

export const initialOf = (name: string) => Array.from(name.trim())[0]?.toUpperCase() ?? "";

export const displayCell = (cell: DelegationCell | undefined, discreet: boolean) => {
  if (!cell) return "";
  return discreet && cell.sensitive ? MASK : cell.value;
};
