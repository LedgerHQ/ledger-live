/**
 * TODO: rework live-common/addAccounts to take into account the new paradigm.
 * it will be simpler: Account and AccountUserData are now explicitly separated so we will have less to reconciliate.
 */

/**
 * This drives the logic of digesting Add Accounts' result and apply the new accounts and account name editions to the underlying stores.
 */

import type { Account, DerivationMode } from "@ledgerhq/types-live";
import uniqWith from "lodash/uniqWith";
import { validateNameEdition } from "./accountName";

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
    (a.freshAddress ? a.currency === b.currency && a.freshAddress === b.freshAddress : false) ||
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
  },
): AddAccountsSectionResult {
  const importedAccounts: Account[] = [];
  const importableAccounts: Account[] = [];
  const creatableAccounts: Account[] = [];
  let alreadyEmptyAccount: Account | null = null;
  const scannedAccountsWithoutMigrate = [...scannedAccounts];

  scannedAccountsWithoutMigrate.forEach(acc => {
    const existingAccount = existingAccounts.find(a => sameAccountIdentity(a, acc));

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
  const sections: AddAccountsSection[] = [];

  if (importableAccounts.length) {
    sections.push({
      id: "importable",
      selectable: true,
      defaultSelected: true,
      data: importableAccounts,
    });
  }

  if (!context.scanning || creatableAccounts.length) {
    // NB if data is empty, need to do custom placeholder that depends on alreadyEmptyAccount
    sections.push({
      id: "creatable",
      selectable: true,
      defaultSelected: false,
      data:
        context.preferredNewAccountSchemes && context.preferredNewAccountSchemes.length > 0
          ? creatableAccounts.filter(
              a =>
                context.preferredNewAccountSchemes &&
                // Note: we could use a simple preferredNewAccountScheme param
                a.derivationMode === context.preferredNewAccountSchemes[0],
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
  deviceId: string;
};

export type AddAccountsAction = {
  type: "ADD_ACCOUNTS";
  payload: {
    // the full state of all accounts to apply on top of the existing ones
    // since the add accounts will possibly do a "migrate" of existing accounts
    allAccounts: Account[];
    // possible edited names that were done on the accounts
    editedNames: Map<string, string>;
    // deviceId?: string;
  };
};

export function addAccountsAction({
  existingAccounts,
  scannedAccounts,
  selectedIds,
  renamings,
  deviceId,
}: AddAccountsProps): AddAccountsAction {
  const newAccounts: Account[] = [];
  // scanned accounts that was selected
  const selected = scannedAccounts.filter(a => selectedIds.includes(a.id));
  existingAccounts.forEach(existing => {
    // we try to find an updated version of the existing account as opportunity to refresh its state
    const update = selected.find(a => sameAccountIdentity(a, existing));
    const account = update || existing;
    newAccounts.push(account);
    // newAccounts.push({...account, deviceId});
    // NOTE: not needed if deviceId already there
  });
  // append the new accounts
  selected.forEach(acc => {
    const alreadyThere = newAccounts.find(r => sameAccountIdentity(r, acc));
    if (!alreadyThere) {
      console.log(`pushing new account `, acc);
      newAccounts.push({...acc, deviceId});
    }
  });
  console.log({newAccounts})
  // deduplicate accounts
  const allAccounts = uniqWith(newAccounts, sameAccountIdentity);
  const editedNames = new Map();
  for (const account of allAccounts) {
    if (renamings[account.id]) {
      const name = validateNameEdition(account, renamings[account.id]);
      editedNames.set(account.id, name);
    }
  }
  debugger;
  return {
    type: "ADD_ACCOUNTS",
    payload: {
      allAccounts,
      editedNames,
      // deviceId,
    },
  };
}
