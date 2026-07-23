import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { Features } from "@shared/feature-flags";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { isSmallValueOperation } from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import {
  flattenOperationWithInternalsAndNfts,
  isAddressPoisoningOperation,
} from "@ledgerhq/ledger-wallet-framework/operation";
import { getEnv } from "@shared/env";
import { HISTORY_DUST_FILTER_THRESHOLD_USD } from "../constants";

/**
 * Mirrors {@link useAddressPoisoningOperationsFamilies} using Redux-resolved flags.
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

export function parseLastSeenMs(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function isOperationUnread(operationDate: Date, lastSeenTs: number | null): boolean {
  return lastSeenTs !== null && operationDate.getTime() > lastSeenTs;
}

/**
 * Mirrors desktop's `historyHasUnreadOperations`:
 * flattens accounts, deduplicates pending ops, applies address-poisoning filter,
 * and checks whether any operation is newer than `lastSeenDate`.
 */
export function hasUnreadOperations(
  accounts: Account[],
  lastSeenDate: string | null,
  shouldFilterTokenOps: boolean,
  addressPoisoningFamilies: string[] | null,
  shouldHideSmallValueTokenOperations = false,
  countervaluesState?: CounterValuesState,
  userCounterValueCurrency?: Currency,
): boolean {
  if (!lastSeenDate) return false;

  const lastSeenTs = parseLastSeenMs(lastSeenDate);
  if (lastSeenTs === null) return false;

  const filterOperation = (operation: Operation, account: AccountLike): boolean => {
    if (
      shouldFilterTokenOps &&
      isAddressPoisoningOperation(
        operation,
        account,
        addressPoisoningFamilies ? { families: addressPoisoningFamilies } : undefined,
      )
    ) {
      return false;
    }

    if (
      shouldHideSmallValueTokenOperations &&
      countervaluesState &&
      userCounterValueCurrency &&
      isSmallValueOperation({
        operation,
        account,
        countervaluesState,
        userCounterValueCurrency,
        thresholdUsd: HISTORY_DUST_FILTER_THRESHOLD_USD,
      })
    ) {
      return false;
    }

    return true;
  };

  const allAccounts = flattenAccounts(accounts);

  return allAccounts.some(account => {
    const operations = account.operations ?? [];
    const pendingOperations = account.pendingOperations ?? [];
    const existingHashes = new Set(operations.map(op => op.hash));
    const deduplicatedPending = pendingOperations.filter(op => !existingHashes.has(op.hash));

    return [...deduplicatedPending, ...operations]
      .filter(op => filterOperation(op, account))
      .flatMap(op => flattenOperationWithInternalsAndNfts(op))
      .filter(op => filterOperation(op, account))
      .some(op => isOperationUnread(op.date, lastSeenTs));
  });
}
