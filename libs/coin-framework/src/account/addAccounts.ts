import type { Account, DerivationMode } from "@ledgerhq/types-live";
import uniqWith from "lodash/uniqWith";
import { validateNameEdition } from "./accountName";
import { clearAccount } from "./helpers";
import { findAccountMigration } from "./support";
// Reference all possible support link
// For now we have only one, but we can union type in future
// We can map .id to a wording.
export type AddAccountSupportLink = {
  id: "segwit_or_native_segwit";
  url: string;
};
export type AddAccountsSection = {
  id: string;
  selectable: boolean;
  defaultSelected: boolean;
  data: Account[];
  supportLink?: AddAccountSupportLink;
};
export type AddAccountsSectionResult = {
  sections: AddAccountsSection[];
  alreadyEmptyAccount: Account | null | undefined;
};

function sameAccountIdentity(a: Account, b: Account) {
  return (
    a.id === b.id ||
    (a.freshAddress
      ? a.currency === b.currency && a.freshAddress === b.freshAddress
      : false) ||
    (a.xpub ? a.currency === b.currency && a.xpub === b.xpub : false)
  );
}

/**
 * logic that for the Add Accounts sectioned list
 */
export function groupAddAccounts(
  existingAccounts: Account[],
  scannedAccounts: Account[],
  context: {
    scanning: boolean;
    preferredNewAccountSchemes?: DerivationMode[];
  }
): AddAccountsSectionResult {
  const importedAccounts: Account[] = [];
  const importableAccounts: Account[] = [];
  const creatableAccounts: Account[] = [];
  const migrateAccounts: Account[] = [];
  let alreadyEmptyAccount;
  const scannedAccountsWithoutMigrate = [...scannedAccounts];
  existingAccounts.forEach((existingAccount) => {
    const migrate = findAccountMigration(
      existingAccount,
      scannedAccountsWithoutMigrate
    );

    if (migrate) {
      migrateAccounts.push({ ...migrate, name: existingAccount.name });
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
  scannedAccountsWithoutMigrate.forEach((acc) => {
    const existingAccount = existingAccounts.find((a) =>
      sameAccountIdentity(a, acc)
    );

    if (existingAccount) {
      if (!acc.used && !alreadyEmptyAccount) {
        alreadyEmptyAccount = existingAccount;
      }

      importedAccounts.push(existingAccount);
    } else if (!acc.used) {
      creatableAccounts.push(acc);
    } else {
      importableAccounts.push(acc);
    }
  });
  const sections: Array<{
    id: string;
    selectable: boolean;
    defaultSelected: boolean;
    data: any;
  }> = [];

  if (importableAccounts.length) {
    sections.push({
      id: "importable",
      selectable: true,
      defaultSelected: true,
      data: importableAccounts,
    });
  }

  if (migrateAccounts.length) {
    sections.push({
      id: "migrate",
      selectable: true,
      defaultSelected: true,
      data: migrateAccounts,
    });
  }

  if (!context.scanning || creatableAccounts.length) {
    // NB if data is empty, need to do custom placeholder that depends on alreadyEmptyAccount
    sections.push({
      id: "creatable",
      selectable: true,
      defaultSelected: false,
      data:
        context.preferredNewAccountSchemes &&
        context.preferredNewAccountSchemes.length > 0
          ? creatableAccounts.filter(
              (a) =>
                context.preferredNewAccountSchemes &&
                // Note: we could use a simple preferredNewAccountScheme param
                a.derivationMode === context.preferredNewAccountSchemes[0]
            )
          : creatableAccounts,
    });
  }

  if (importedAccounts.length) {
    sections.push({
      id: "imported",
      selectable: false,
      defaultSelected: false,
      data: importedAccounts,
    });
  }

  return {
    sections,
    alreadyEmptyAccount,
  };
}
export type AddAccountsProps = {
  existingAccounts: Account[];
  scannedAccounts: Account[];
  selectedIds: string[];
  renamings: Record<string, string>;
};

const preserveUserData = (update: Account, existing: Account): Account => ({
  ...update,
  name: existing.name,
});

export function migrateAccounts({
  scannedAccounts,
  existingAccounts,
}: {
  scannedAccounts: Account[];
  existingAccounts: Account[];
}): Account[] {
  // subset of scannedAccounts that exists to not add them but just do migration part
  const subset: Account[] = [];
  existingAccounts.forEach((existing) => {
    const migration = findAccountMigration(existing, scannedAccounts);

    if (migration && !subset.some((a) => a.id === migration.id)) {
      subset.push(migration);
    }
  });
  return addAccounts({
    scannedAccounts: subset,
    existingAccounts,
    selectedIds: subset.map((a) => a.id),
    renamings: {},
  });
}
export function addAccounts({
  scannedAccounts,
  existingAccounts,
  selectedIds,
  renamings,
}: AddAccountsProps): Account[] {
  const newAccounts: Account[] = [];
  // scanned accounts that was selected
  const selected = scannedAccounts.filter((a) => selectedIds.includes(a.id));
  // we'll search for potential migration and append to newAccounts
  existingAccounts.forEach((existing) => {
    const migration = findAccountMigration(existing, selected);

    if (migration) {
      if (!newAccounts.some((a) => a.id === migration.id)) {
        newAccounts.push(preserveUserData(migration, existing));
        const index = selected.indexOf(migration);

        if (index !== -1) {
          selected[index] = selected[selected.length - 1];
          selected.pop();
        }
      }
    } else {
      // we'll try to find an updated version of the existing account as opportunity to refresh the operations
      const update = selected.find((a) => sameAccountIdentity(a, existing));

      if (update) {
        // preserve existing name
        let acc = preserveUserData(update, existing);

        if (update.id !== existing.id) {
          acc = clearAccount(acc);
        }

        newAccounts.push(acc);
      } else {
        newAccounts.push(existing);
      }
    }
  });
  // append the new accounts
  selected.forEach((acc) => {
    const alreadyThere = newAccounts.find((a) => sameAccountIdentity(a, acc));

    if (!alreadyThere) {
      newAccounts.push(acc);
    }
  });
  // dedup and apply the renaming
  return uniqWith(newAccounts, sameAccountIdentity).map((a) => {
    const name = validateNameEdition(a, renamings[a.id]);
    if (name) return { ...a, name };
    return a;
  });
}
