// @flow
import type { Account, CryptoCurrency, DerivationMode } from "../types";
import { getEnv } from "../env";
import { validateNameEdition } from "./accountName";
import { isAccountEmpty } from "./helpers";
import { decodeAccountId } from "./accountId";

export const shouldShowNewAccount = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
) =>
  derivationMode === ""
    ? !!getEnv("SHOW_LEGACY_NEW_ACCOUNT") || !currency.supportsSegwit
    : derivationMode === "segwit" || derivationMode === "native_segwit";

export function canBeMigrated(account: Account) {
  const { type } = decodeAccountId(account.id);
  // at the moment migrations requires experimental libcore
  if (!getEnv("EXPERIMENTAL_LIBCORE")) return false;
  return type === "ethereumjs";
}

// attempt to find an account in scanned accounts that satisfy a migration
export function findAccountMigration(
  account: Account,
  scannedAccounts: Account[]
): ?Account {
  if (!canBeMigrated(account)) return;
  const { type } = decodeAccountId(account.id);
  if (type === "ethereumjs") {
    return scannedAccounts.find(a => a.freshAddress === account.freshAddress);
  }
}

export type AddAccountsSection = {
  id: string,
  selectable: boolean,
  defaultSelected: boolean,
  data: Account[]
};

export type AddAccountsSectionResult = {
  sections: AddAccountsSection[],
  alreadyEmptyAccount: ?Account
};

/**
 * logic that for the Add Accounts sectioned list
 */
export function groupAddAccounts(
  existingAccounts: Account[],
  scannedAccounts: Account[],
  context: {
    scanning: boolean
  }
): AddAccountsSectionResult {
  const importedAccounts = [];
  const importableAccounts = [];
  const creatableAccounts = [];
  const migrateAccounts = [];
  let alreadyEmptyAccount;

  const scannedAccountsWithoutMigrate = [...scannedAccounts];
  existingAccounts.forEach(existingAccount => {
    const migrate = findAccountMigration(
      existingAccount,
      scannedAccountsWithoutMigrate
    );
    if (migrate) {
      migrateAccounts.push({
        ...migrate,
        name: existingAccount.name
      });
      const index = scannedAccountsWithoutMigrate.indexOf(migrate);
      if (index !== -1) {
        scannedAccountsWithoutMigrate[index] =
          scannedAccountsWithoutMigrate[
            scannedAccountsWithoutMigrate.length - 1
          ];
        scannedAccountsWithoutMigrate.pop();
      }
    }
  });

  scannedAccountsWithoutMigrate.forEach(acc => {
    const existingAccount = existingAccounts.find(a => a.id === acc.id);
    const empty = isAccountEmpty(acc);
    if (existingAccount) {
      if (empty) {
        alreadyEmptyAccount = existingAccount;
      }
      importedAccounts.push(existingAccount);
    } else if (empty) {
      creatableAccounts.push(acc);
    } else {
      importableAccounts.push(acc);
    }
  });

  const sections = [];

  if (importableAccounts.length) {
    sections.push({
      id: "importable",
      selectable: true,
      defaultSelected: true,
      data: importableAccounts
    });
  }
  if (migrateAccounts.length) {
    sections.push({
      id: "migrate",
      selectable: true,
      defaultSelected: true,
      data: migrateAccounts
    });
  }
  if (!context.scanning || creatableAccounts.length) {
    // NB if data is empty, need to do custom placeholder that depends on alreadyEmptyAccount
    sections.push({
      id: "creatable",
      selectable: true,
      defaultSelected: false,
      data: creatableAccounts
    });
  }

  if (importedAccounts.length) {
    sections.push({
      id: "imported",
      selectable: false,
      defaultSelected: false,
      data: importedAccounts
    });
  }

  return {
    sections,
    alreadyEmptyAccount
  };
}

export type AddAccountsProps = {
  existingAccounts: Account[],
  scannedAccounts: Account[],
  selectedIds: string[],
  renamings: { [_: string]: string }
};

export function addAccounts({
  scannedAccounts,
  existingAccounts,
  selectedIds,
  renamings
}: AddAccountsProps): Account[] {
  const newAccounts = [];

  // scanned accounts that was selected
  const selected = scannedAccounts.filter(a => selectedIds.includes(a.id));

  // we'll search for potential migration and append to newAccounts
  existingAccounts.forEach(existing => {
    const migration = findAccountMigration(existing, selected);
    if (migration) {
      if (!newAccounts.includes(migration)) {
        newAccounts.push(migration);
        const index = selected.indexOf(migration);
        if (index !== -1) {
          selected[index] = selected[selected.length - 1];
          selected.pop();
        }
      }
    } else {
      // we'll try to find an updated version of the existing account as opportunity to refresh the operations
      const update = selected.find(a => a.id === existing.id);
      if (update) {
        // preserve existing name
        newAccounts.push({ ...update, name: existing.name });
      } else {
        newAccounts.push(existing);
      }
    }
  });

  // append the new accounts
  selected.forEach(acc => {
    const alreadyThere = newAccounts.find(a => a.id === acc.id);
    if (!alreadyThere) {
      newAccounts.push(acc);
    }
  });

  // apply the renaming
  return newAccounts.map(a => {
    const name = validateNameEdition(a, renamings[a.id]);
    if (name) return { ...a, name };
    return a;
  });
}
