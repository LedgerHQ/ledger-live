import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { flattenAccounts, getAccountCurrency } from "../account/index";

export type FundsReceivedTrackingProperties = {
  asset: string;
  network: string;
};

export type NewlyReceivedOperation = {
  account: AccountLike;
  operation: Operation;
};

export function getFundsReceivedTrackingProperties(
  account: AccountLike,
): FundsReceivedTrackingProperties {
  const currency = getAccountCurrency(account);
  const asset = currency.name;

  if (currency.type === "TokenCurrency") {
    const network = findCryptoCurrencyById(currency.parentCurrencyId)?.name ?? asset;
    return { asset, network };
  }

  return { asset, network: asset };
}

function isReceiveOperation(operation: Operation): boolean {
  return operation.type === "IN" && !operation.hasFailed;
}

export function buildReceiveOperationsSnapshot(accounts: Account[]): Map<string, Set<string>> {
  const snapshot = new Map<string, Set<string>>();

  for (const accountLike of flattenAccounts(accounts)) {
    const operationIds = new Set<string>();

    for (const operation of accountLike.operations) {
      if (isReceiveOperation(operation)) {
        operationIds.add(operation.id);
      }
    }

    snapshot.set(accountLike.id, operationIds);
  }

  return snapshot;
}

export function findNewlyReceivedOperations(
  accounts: Account[],
  previousSnapshot: Map<string, Set<string>> | null,
): NewlyReceivedOperation[] {
  if (!previousSnapshot) {
    return [];
  }

  const newlyReceivedOperations: NewlyReceivedOperation[] = [];

  for (const accountLike of flattenAccounts(accounts)) {
    const previousOperationIds = previousSnapshot.get(accountLike.id);
    if (!previousOperationIds) {
      continue;
    }

    for (const operation of accountLike.operations) {
      if (isReceiveOperation(operation) && !previousOperationIds.has(operation.id)) {
        newlyReceivedOperations.push({ account: accountLike, operation });
      }
    }
  }

  return newlyReceivedOperations;
}
