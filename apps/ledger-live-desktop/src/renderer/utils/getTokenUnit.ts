import { Account } from "@ledgerhq/types-live";

export const getTokenUnit = (
  label: string,
  account?: Account,
  contractAddress?: string | string[],
) => {
  if (!label.includes("Amount") || !account || !contractAddress) return undefined;

  const address = Array.isArray(contractAddress) ? contractAddress[0] : contractAddress;

  return account.subAccounts?.find(a => a.token.contractAddress === address)?.token.units[0];
};
