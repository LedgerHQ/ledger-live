import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import {
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
  ConcordiumPairingProgress,
  ConcordiumPairingStatus,
} from "@ledgerhq/coin-concordium";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

export const MAX_EXPIRED_RETRIES = 3;

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
  existingAccounts: Account[];
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

  // on previous step the onboarding account is not yet finalized
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

export const CONFIRMATION_CODE_LENGTH = 4;

export function getConfirmationCode(sessionTopic: string): string {
  if (sessionTopic.length < CONFIRMATION_CODE_LENGTH) {
    throw new Error(
      `Invalid sessionTopic: expected at least ${CONFIRMATION_CODE_LENGTH} characters, got ${sessionTopic.length}`,
    );
  }
  return sessionTopic.substring(0, CONFIRMATION_CODE_LENGTH).toUpperCase();
}

export function shouldRetryPairing(error: unknown, retryCount: number): boolean {
  if (retryCount >= MAX_EXPIRED_RETRIES) {
    return false;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  return errorMessage.toLowerCase().includes("expired");
}

export type PairingStateUpdate = {
  onboardingStatus: AccountOnboardStatus;
  walletConnectUri?: string | null;
  sessionTopic?: string | null;
  isPairing?: boolean;
};

export function handlePairingProgress(data: ConcordiumPairingProgress): PairingStateUpdate | null {
  switch (data.status) {
    case ConcordiumPairingStatus.PREPARE:
      if ("walletConnectUri" in data && data.walletConnectUri) {
        return {
          onboardingStatus: AccountOnboardStatus.PREPARE,
          walletConnectUri: data.walletConnectUri,
        };
      }
      return null;

    case ConcordiumPairingStatus.SUCCESS:
      if ("sessionTopic" in data && data.sessionTopic) {
        return {
          isPairing: false,
          onboardingStatus: AccountOnboardStatus.SUCCESS,
          sessionTopic: data.sessionTopic,
          walletConnectUri: null,
        };
      }
      return null;

    default:
      return null;
  }
}

export type OnboardingStateUpdate = {
  onboardingStatus: AccountOnboardStatus;
  onboardingResult?: {
    completedAccount: Account;
  };
  isProcessing?: boolean;
};

export function handleOnboardingProgress(
  data: ConcordiumOnboardProgress | ConcordiumOnboardResult,
): OnboardingStateUpdate | null {
  if ("status" in data && data.status === AccountOnboardStatus.SIGN) {
    return {
      onboardingStatus: AccountOnboardStatus.SIGN,
    };
  }

  if ("status" in data && data.status === AccountOnboardStatus.SUBMIT) {
    return {
      onboardingStatus: AccountOnboardStatus.SUBMIT,
    };
  }

  if ("account" in data) {
    return {
      onboardingResult: {
        completedAccount: data.account,
      },
      onboardingStatus: AccountOnboardStatus.SUCCESS,
      isProcessing: false,
    };
  }

  return null;
}
