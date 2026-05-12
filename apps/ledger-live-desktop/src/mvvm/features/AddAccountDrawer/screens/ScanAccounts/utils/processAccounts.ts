import { groupAddAccounts } from "@ledgerhq/live-wallet/addAccounts";
import { Account, DerivationMode } from "@ledgerhq/types-live";

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
