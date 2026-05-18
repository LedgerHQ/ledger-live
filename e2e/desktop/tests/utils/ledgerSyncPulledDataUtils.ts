import { expect } from "@playwright/test";
import invariant from "invariant";

export interface LedgerSyncAccountData {
  id?: string;
  currencyId?: string;
  index?: number;
}

export interface LedgerSyncPulledData {
  updateEvent?: {
    data?: {
      accounts?: LedgerSyncAccountData[];
      accountNames?: Record<string, string>;
    };
  };
}

export interface ExpectedSyncedAccountData {
  deletedAccountId: string;
  remainingAccountId: string;
  expectedRemainingAccountName: string;
}

function parseLedgerSyncPulledData(pulledData: string | void): LedgerSyncPulledData {
  invariant(pulledData, "Ledger Sync: pulledData is undefined");
  try {
    const parsedData: LedgerSyncPulledData = JSON.parse(pulledData);
    return parsedData;
  } catch (error) {
    throw new Error(`Failed to parse pulledData: ${error}`, { cause: error });
  }
}

function hasSyncedAccount(parsedData: LedgerSyncPulledData, accountId: string): boolean {
  const accounts = parsedData.updateEvent?.data?.accounts;

  if (!accounts) {
    return false;
  }

  return accounts.some(account => account.id === accountId);
}

function getSyncedAccountIds(parsedData: LedgerSyncPulledData): string[] {
  const accounts = parsedData.updateEvent?.data?.accounts;

  if (accounts) {
    return accounts
      .map(account => account.id)
      .filter((accountId): accountId is string => Boolean(accountId));
  }

  return [];
}

function isAccountDeleted(parsedData: LedgerSyncPulledData, accountId: string): boolean {
  return !hasSyncedAccount(parsedData, accountId);
}

export function expectPulledDataToMatchAccountChanges(
  pulledData: string | void,
  { deletedAccountId, remainingAccountId, expectedRemainingAccountName }: ExpectedSyncedAccountData,
) {
  const parsedData = parseLedgerSyncPulledData(pulledData);

  expect(
    getSyncedAccountIds(parsedData),
    "Backend data should only contain the remaining account",
  ).toEqual([remainingAccountId]);
  expect(
    isAccountDeleted(parsedData, deletedAccountId),
    "Deleted account should not be present in backend accounts",
  ).toBe(true);
  const remainingAccountName = parsedData.updateEvent?.data?.accountNames?.[remainingAccountId];
  expect(remainingAccountName, "Backend account name should match the renamed account").toBe(
    expectedRemainingAccountName,
  );
}
