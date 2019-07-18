// @flow
import uniqBy from "lodash/uniqBy";
import type { Account } from "../types";
import { validateNameEdition } from "./accountName";
import { isAccountEmpty } from "./helpers";
import { findAccountMigration } from "./support";

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
    const existingAccount = existingAccounts.find(
      a =>
        a.id === acc.id ||
        (a.freshAddress &&
          a.currency === acc.currency &&
          a.freshAddress === acc.freshAddress)
    );
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

const preserveUserData = (update: Account, existing: Account) => ({
  ...update,
  name: existing.name
});

export function migrateAccounts({
  scannedAccounts,
  existingAccounts
}: {
  scannedAccounts: Account[],
  existingAccounts: Account[]
}): Account[] {
  // subset of scannedAccounts that exists to not add them but just do migration part
  const subset = [];
  existingAccounts.forEach(existing => {
    const migration = findAccountMigration(existing, scannedAccounts);
    if (migration && !subset.some(a => a.id === migration.id)) {
      subset.push(migration);
    }
  });
  return addAccounts({
    scannedAccounts: subset,
    existingAccounts,
    selectedIds: subset.map(a => a.id),
    renamings: {}
  });
}

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
      if (!newAccounts.some(a => a.id === migration.id)) {
        newAccounts.push(preserveUserData(migration, existing));
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
        newAccounts.push(preserveUserData(update, existing));
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

  // dedup and apply the renaming
  return uniqBy(newAccounts, "id").map(a => {
    const name = validateNameEdition(a, renamings[a.id]);
    if (name) return { ...a, name };
    return a;
  });
}
