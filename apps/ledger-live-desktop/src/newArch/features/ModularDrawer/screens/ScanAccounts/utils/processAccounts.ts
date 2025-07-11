import { isAccountEmpty } from "@ledgerhq/live-common/account/index";
import { groupAddAccounts } from "@ledgerhq/live-wallet/addAccounts";
import { Account, DerivationMode } from "@ledgerhq/types-live";

export const getUnimportedAccounts = (
  scannedAccounts: Account[],
  existingAccounts: Account[],
): Account[] => {
  const seen = new Set<string>();
  return scannedAccounts.filter(account => {
    const exists = existingAccounts.some(a => a.id === account.id);
    const isDuplicate = seen.has(account.id);
    if (!exists && !isDuplicate) {
      seen.add(account.id);
      return true;
    }
    return false;
  });
};

export const areAllAccountsEmpty = (accounts: Account[]) => accounts.every(isAccountEmpty);

export const processAccounts = (scannedAccounts: Account[], existingAccounts: Account[]) => {
  const unimportedAccounts = getUnimportedAccounts(scannedAccounts, existingAccounts);
  const onlyNewAccounts = areAllAccountsEmpty(unimportedAccounts);

  return { unimportedAccounts, onlyNewAccounts };
};

export const determineSelectedIds = (
  accounts: Account[],
  onlyNewAccounts: boolean,
  currentSelectedIds: string[],
) => {
  if (onlyNewAccounts) {
    return accounts.map(x => x.id);
  }

  const latestAccount = accounts.at(-1);
  if (latestAccount && !isAccountEmpty(latestAccount)) {
    return [...currentSelectedIds, latestAccount.id];
  }

  return currentSelectedIds;
};

export const getGroupedAccounts = (
  existingAccounts: Account[],
  scannedAccounts: Account[],
  scanning: boolean,
  newAccountSchemes: DerivationMode[],
  showAllCreatedAccounts: boolean,
) => {
  const preferredNewAccountScheme = newAccountSchemes.length ? newAccountSchemes[0] : undefined;

  const { sections, alreadyEmptyAccount } = groupAddAccounts(existingAccounts, scannedAccounts, {
    scanning,
    preferredNewAccountSchemes: showAllCreatedAccounts ? undefined : [preferredNewAccountScheme!],
  });

  const importableAccounts = sections.find(section => section.id === "importable")?.data || [];
  const creatableAccounts = sections.find(section => section.id === "creatable")?.data || [];

  return {
    importableAccounts,
    creatableAccounts,
    alreadyEmptyAccount,
  };
};
