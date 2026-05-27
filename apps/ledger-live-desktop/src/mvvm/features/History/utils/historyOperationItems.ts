import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { Features } from "@shared/feature-flags";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import {
  flattenAccounts,
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getOperationAmountNumber,
  flattenOperationWithInternalsAndNfts,
  isConfirmedOperation,
} from "@ledgerhq/live-common/operation";
import { isAddressPoisoningOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { currencySettingsDefaults, type CurrencySettings } from "~/renderer/reducers/settings";
import { getOperationCounterpartyAddress } from "./getOperationCounterpartyAddress";
import type { OperationTableItem } from "../types";

type AccountInfo = { account: AccountLike; parentAccount?: Account };
type FilterFn = (operation: Operation, account: AccountLike) => boolean;
type TaggedOperation = { operation: Operation; isPending: boolean };

export function parseLastSeenMs(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function isOperationUnread(operationDate: Date, lastSeenTs: number | null): boolean {
  return lastSeenTs !== null && operationDate.getTime() > lastSeenTs;
}

/**
 * Mirrors {@link useAddressPoisoningOperationsFamilies} using Redux-resolved flags
 * (same inputs as {@link selectFeature} for `addressPoisoningOperationsFilter`).
 */
export function getAddressPoisoningFamiliesForFilter(
  shouldFilter: boolean,
  feature: Features["addressPoisoningOperationsFilter"] | undefined,
): string[] | null {
  if (!shouldFilter) return null;
  if (!feature?.enabled) {
    return getEnv("ADDRESS_POISONING_FAMILIES")
      .split(",")
      .map(s => s.trim());
  }
  return feature.params?.families ?? null;
}

function buildAccountsMap(accounts: Account[]): Map<string, AccountInfo> {
  const allAccounts = flattenAccounts(accounts);
  const mainAccountsById = new Map(
    accounts.filter((a): a is Account => a.type === "Account").map(a => [a.id, a]),
  );
  const accountsById = new Map<string, AccountInfo>();

  for (const acc of allAccounts) {
    const parentAccount = acc.type === "Account" ? undefined : mainAccountsById.get(acc.parentId);
    accountsById.set(acc.id, { account: acc, parentAccount });
  }

  return accountsById;
}

function deduplicateAndTagOperations(
  acc: AccountLike,
  mainAccount: Account,
  confirmationsNb: number,
): TaggedOperation[] {
  const existingHashes = new Set(acc.operations.map(op => op.hash));

  const pending: TaggedOperation[] = acc.pendingOperations
    .filter(op => !existingHashes.has(op.hash))
    .map(operation => ({ operation, isPending: true }));

  const confirmed: TaggedOperation[] = acc.operations.map(operation => ({
    operation,
    isPending: !isConfirmedOperation(operation, mainAccount, confirmationsNb),
  }));

  return [...pending, ...confirmed];
}

function toTableItem(
  operation: Operation,
  info: AccountInfo,
  isPending: boolean,
  lastSeenTs: number | null,
): OperationTableItem {
  const { account, parentAccount } = info;
  return {
    id: `${account.id}_${operation.id}`,
    operation,
    account,
    parentAccount,
    date: operation.date,
    type: operation.type,
    address: getOperationCounterpartyAddress(operation),
    amount: getOperationAmountNumber(operation),
    currency: getAccountCurrency(account),
    isPending,
    isUnread: isOperationUnread(operation.date, lastSeenTs),
  };
}

function collectAccountOperations(
  info: AccountInfo,
  filterOperation: FilterFn,
  mainAccount: Account,
  confirmationsNb: number,
  lastSeenTs: number | null,
): OperationTableItem[] {
  const taggedOps = deduplicateAndTagOperations(info.account, mainAccount, confirmationsNb);
  return taggedOps.flatMap(({ operation: rawOp, isPending }) => {
    if (!filterOperation(rawOp, info.account)) return [];
    return flattenOperationWithInternalsAndNfts(rawOp)
      .filter(op => filterOperation(op, info.account))
      .map(op => toTableItem(op, info, isPending, lastSeenTs));
  });
}

function buildOperationItems(
  accountsMap: Map<string, AccountInfo>,
  filterOperation: FilterFn,
  getConfirmationsNb: (mainAccount: Account) => number,
  lastSeenTs: number | null,
): OperationTableItem[] {
  return [...accountsMap.values()].flatMap(info => {
    const mainAccount = getMainAccount(info.account, info.parentAccount);
    const confirmationsNb = getConfirmationsNb(mainAccount);
    return collectAccountOperations(
      info,
      filterOperation,
      mainAccount,
      confirmationsNb,
      lastSeenTs,
    );
  });
}

export function getConfirmationsNbForCurrency(
  currenciesSettings: Record<string, CurrencySettings>,
  currency: CryptoCurrency,
): number {
  const obj = currenciesSettings[currency.ticker];
  if (obj) return obj.confirmationsNb;
  const defs = currencySettingsDefaults(currency);
  return defs.confirmationsNb ? defs.confirmationsNb.def : 0;
}

export function buildHistoryOperationItems(
  accounts: Account[],
  lastSeenOperationDate: string | null,
  currenciesSettings: Record<string, CurrencySettings>,
  filterOperation: FilterFn,
): OperationTableItem[] {
  const lastSeenTs = parseLastSeenMs(lastSeenOperationDate);
  const getConfirmationsNb = (mainAccount: Account) =>
    getConfirmationsNbForCurrency(currenciesSettings, mainAccount.currency);

  const accountsMap = buildAccountsMap(accounts);
  const items = buildOperationItems(accountsMap, filterOperation, getConfirmationsNb, lastSeenTs);
  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * True when any operation that would appear in the global History list is newer than `lastSeenDate`.
 * Uses the same flattening, pending merge, and filters as {@link buildHistoryOperationItems}.
 */
export function historyHasUnreadOperations(
  accounts: Account[],
  lastSeenDate: string | null,
  currenciesSettings: Record<string, CurrencySettings>,
  shouldFilterTokenOps: boolean,
  addressPoisoningFamilies: string[] | null,
): boolean {
  if (!lastSeenDate) return false;
  const lastSeenTs = parseLastSeenMs(lastSeenDate);
  const filterOperation: FilterFn = (operation, account) => {
    if (!shouldFilterTokenOps) return true;
    return !isAddressPoisoningOperation(
      operation,
      account,
      addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
    );
  };
  const getConfirmationsNb = (mainAccount: Account) =>
    getConfirmationsNbForCurrency(currenciesSettings, mainAccount.currency);
  const accountsMap = buildAccountsMap(accounts);
  const items = buildOperationItems(accountsMap, filterOperation, getConfirmationsNb, lastSeenTs);
  return items.some(item => item.isUnread);
}
