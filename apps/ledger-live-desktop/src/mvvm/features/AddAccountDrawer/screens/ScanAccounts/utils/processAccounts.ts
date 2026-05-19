import { groupAddAccounts } from "@ledgerhq/live-wallet/addAccounts";
import { Account, DerivationMode } from "@ledgerhq/types-live";

type IsAccountEmpty = (account: Account) => boolean;

export const getUnimportedAccounts = (scanned: Account[], existing: Account[]): Account[] => {
  const existingIds = new Set(existing.map(acc => acc.id));
  const seen = new Set<string>();

  return scanned.filter(acc => {
    if (existingIds.has(acc.id) || seen.has(acc.id)) {
      return false;
    }
    seen.add(acc.id);
    return true;
  });
};

export const determineSelectedIds = (
  accounts: Account[],
  onlyNewAccounts: boolean,
  currentSelectedIds: string[],
  isAccountEmpty: IsAccountEmpty,
) => {
  if (onlyNewAccounts) {
    return accounts.map(x => x.id);
  }

  const latestAccount = accounts.at(-1);
  return latestAccount && !isAccountEmpty(latestAccount)
    ? [...currentSelectedIds, latestAccount.id]
    : currentSelectedIds;
};

export const computeSelectedIdsFromScan = (
  scannedAccounts: Account[],
  existingAccounts: Account[],
  currentSelectedIds: string[],
  isAccountEmpty: IsAccountEmpty,
): string[] => {
  const unimportedAccounts = getUnimportedAccounts(scannedAccounts, existingAccounts);
  const onlyNewAccounts = unimportedAccounts.every(isAccountEmpty);

  const processedAccountIds = new Set<string>();
  const freshAccounts = unimportedAccounts.filter(acc => {
    if (processedAccountIds.has(acc.id)) {
      return false;
    }
    processedAccountIds.add(acc.id);
    return true;
  });

  return determineSelectedIds(freshAccounts, onlyNewAccounts, currentSelectedIds, isAccountEmpty);
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
    preferredNewAccountSchemes:
      showAllCreatedAccounts || !preferredNewAccountScheme
        ? undefined
        : [preferredNewAccountScheme],
  });

  const importableAccounts = sections.find(section => section.id === "importable")?.data || [];
  const creatableAccounts = sections.find(section => section.id === "creatable")?.data || [];

  return {
    importableAccounts,
    creatableAccounts,
    alreadyEmptyAccount,
  };
};
