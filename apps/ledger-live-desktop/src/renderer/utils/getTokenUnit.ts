import { Account } from "@ledgerhq/types-live";

export const getTokenUnit = (
  label: string,
  account?: Account,
  contractAddress?: string | string[],
) => {
  const unit =
    label.includes("Amount") && account && contractAddress
      ? account.subAccounts?.find(a => a.token.contractAddress === contractAddress)?.token.units[0]
      : undefined;

  return unit;
};
