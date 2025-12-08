import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { useMemo } from "react";

export function getCreatableAccount(
  selectedAccounts: Account[],
  accountToReonboard?: Account,
  isReonboarding?: boolean,
): Account | undefined {
  if (isReonboarding) {
    return accountToReonboard;
  }
  return selectedAccounts.find(account => !account.used);
}

export function getImportableAccounts(selectedAccounts: Account[]): Account[] {
  return selectedAccounts.filter(account => account.used);
}

function resolveAccountName(
  account: Account,
  editedNames: { [accountId: string]: string },
): string {
  return editedNames[account.id] || getDefaultAccountName(account);
}

export function resolveCreatableAccountName(
  currency: CryptoCurrency,
  creatableAccount: Account | undefined,
  editedNames: { [accountId: string]: string },
  importableAccountsCount: number,
): string {
  if (!creatableAccount) {
    return `${currency.name} ${importableAccountsCount + 1}`;
  }
  return resolveAccountName(creatableAccount, editedNames);
}

type AddAccountsConfig = {
  selectedAccounts: Account[];
  existingAccounts: Account[];
  editedNames: { [accountId: string]: string };
  accountToReonboard?: Account;
  isReonboarding?: boolean;
  onboardingResult?: {
    completedAccount: Account;
  };
};

function prepareAccountsForReonboarding(
  accountToReonboard: Account,
  completedAccount: Account,
  editedNames: { [accountId: string]: string },
): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const updatedAccount = {
    ...accountToReonboard,
    ...completedAccount,
    id: accountToReonboard.id,
  };

  return {
    accounts: [updatedAccount],
    renamings: {
      [updatedAccount.id]:
        editedNames[accountToReonboard.id] || getDefaultAccountName(updatedAccount),
    },
  };
}

function prepareAccountsForNewOnboarding(
  importableAccounts: Account[],
  completedAccount: Account | undefined,
  editedNames: { [accountId: string]: string },
): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const accounts = [...importableAccounts];
  if (completedAccount) {
    accounts.push(completedAccount);
  }

  // On previous step we don't have a partyId yet for onboarding account
  // so editedNames may use a temporary account ID
  // Since only one account is onboarded at a time, we can filter out importableAccounts renamings
  // What is left belongs to the onboarded account
  const importableAccountIds = new Set(importableAccounts.map(acc => acc.id));

  // Find the name for the completed account by looking for entries that don't match importable accounts
  // This handles the case where a temporary ID was used before the account was created
  const completedAccountNameEntry = Object.entries(editedNames).find(
    ([accountId]) => !importableAccountIds.has(accountId),
  );
  const completedAccountName = completedAccountNameEntry?.[1];

  const renamings = Object.fromEntries(
    accounts.map(account => {
      if (importableAccountIds.has(account.id)) {
        return [account.id, editedNames[account.id] || getDefaultAccountName(account)];
      }

      if (completedAccount && account.id === completedAccount.id) {
        return [
          account.id,
          completedAccountName || editedNames[account.id] || getDefaultAccountName(account),
        ];
      }

      return [account.id, editedNames[account.id] || getDefaultAccountName(account)];
    }),
  );

  return { accounts, renamings };
}

export function prepareAccountsForAdding(config: AddAccountsConfig): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const { selectedAccounts, editedNames, accountToReonboard, isReonboarding, onboardingResult } =
    config;

  const importableAccounts = getImportableAccounts(selectedAccounts);
  const completedAccount = onboardingResult?.completedAccount;

  if (isReonboarding && accountToReonboard && completedAccount) {
    return prepareAccountsForReonboarding(accountToReonboard, completedAccount, editedNames);
  }

  return prepareAccountsForNewOnboarding(importableAccounts, completedAccount, editedNames);
}

export function useOnboardingAccountData({
  currency,
  selectedAccounts,
  editedNames,
  accountToReonboard,
  isReonboarding,
}: {
  currency: CryptoCurrency;
  selectedAccounts: Account[];
  editedNames: { [accountId: string]: string };
  accountToReonboard?: Account;
  isReonboarding?: boolean;
}) {
  const importableAccounts = useMemo(
    () => getImportableAccounts(selectedAccounts),
    [selectedAccounts],
  );

  const creatableAccount = useMemo(
    () => getCreatableAccount(selectedAccounts, accountToReonboard, isReonboarding),
    [selectedAccounts, accountToReonboard, isReonboarding],
  );

  const accountName = useMemo(
    () =>
      resolveCreatableAccountName(
        currency,
        creatableAccount,
        editedNames,
        importableAccounts.length,
      ),
    [currency, creatableAccount, editedNames, importableAccounts.length],
  );

  return {
    importableAccounts,
    creatableAccount,
    accountName,
  };
}
