import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

export function getCreatableAccount(selectedAccounts: Account[]): Account | undefined {
  return selectedAccounts.find(account => !account.used);
}

export function getImportableAccounts(selectedAccounts: Account[]): Account[] {
  return selectedAccounts.filter(account => account.used);
}

export function resolveAccountName(
  account: Account,
  editedNames: { [accountId: string]: string },
): string {
  return editedNames[account.id] || getDefaultAccountName(account);
}

export function resolveCreatableAccountName(
  creatableAccount: Account | undefined,
  currency: CryptoCurrency,
  editedNames: { [accountId: string]: string },
  importableAccountsCount: number,
): string {
  if (!creatableAccount) {
    return `${currency.name} ${importableAccountsCount + 1}`;
  }
  return resolveAccountName(creatableAccount, editedNames);
}

export type AddAccountsConfig = {
  selectedAccounts: Account[];
  editedNames: { [accountId: string]: string };
  onboardingResult?: {
    completedAccount: Account;
  };
};

export function prepareAccountsForNewOnboarding(
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

  // the onboarding account is not yet finalized
  // so editedNames use a temporary account ID
  // since only one account is onboarded at a time, we can filter out importableAccounts renamings
  // what is left belongs to the onboarded account
  const importableAccountIds = new Set(importableAccounts.map(acc => acc.id));
  const [, completedAccountName] =
    Object.entries(editedNames).find(([accountId]) => !importableAccountIds.has(accountId)) || [];

  const renamings = Object.fromEntries(
    accounts.map(account => {
      let accountName = editedNames[account.id];

      if (completedAccount && account.id === completedAccount.id && completedAccountName) {
        accountName = completedAccountName;
      }

      return [account.id, accountName || getDefaultAccountName(account)];
    }),
  );

  return { accounts, renamings };
}

export function prepareAccountsForAdding(config: AddAccountsConfig): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const { selectedAccounts, editedNames, onboardingResult } = config;

  const importableAccounts = getImportableAccounts(selectedAccounts);
  const completedAccount = onboardingResult?.completedAccount;

  return prepareAccountsForNewOnboarding(importableAccounts, completedAccount, editedNames);
}
