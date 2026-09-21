import { BigNumber } from "bignumber.js";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import { findUtxo } from "./utils";

/** Sum of the account's transparent (public pool) UTXOs. */
export function transparentBalance(account: ZcashAccount): BigNumber {
  return account.bitcoinResources.utxos.reduce(
    (sum, utxo) => sum.plus(utxo.value),
    new BigNumber(0),
  );
}

/** Ironwood (private/shielded pool) balance, as tracked on the account's `privateInfo`. */
export function ironwoodBalance(account: ZcashAccount): BigNumber {
  return account.privateInfo?.ironwoodBalance ?? new BigNumber(0);
}

/**
 * The operations the sync recorded for the transaction a scenario just made.
 *
 * A cross-pool transaction is recorded by both sync legs, and when the two records
 * report opposite directions -- a self-transfer between the account's own pools --
 * both are kept, so there is no single "latest operation" to read
 * (`reconcileLegOperations`, coin-zcash/bridge/sync.ts).
 */
export function newOperations(previous: ZcashAccount, current: ZcashAccount) {
  const before = new Set(previous.operations.map(op => op.id));
  return current.operations.filter(op => !before.has(op.id));
}

/** Types of the operations above, sorted, for an order-independent assertion. */
export function newOperationTypes(previous: ZcashAccount, current: ZcashAccount): string[] {
  return newOperations(previous, current)
    .map(op => op.type as string)
    .sort();
}

/** The one leg of that transaction carrying the given operation type. */
export function newOperationOfType(previous: ZcashAccount, current: ZcashAccount, type: string) {
  const legs = newOperations(previous, current).filter(op => op.type === type);
  expect(legs).toHaveLength(1);
  return legs[0];
}

export function assertCommonTxProperties(previous: ZcashAccount, current: ZcashAccount) {
  const [latestOperation] = current.operations;
  expect(current.operations.length - previous.operations.length).toBe(1);
  expect(latestOperation.type).toBe("OUT");
  expect(current.balance.toFixed()).toBe(previous.balance.minus(latestOperation.value).toFixed());
  return latestOperation;
}

export function assertUtxoSpent(
  previous: ZcashAccount,
  current: ZcashAccount,
  hash: string,
  outputIndex: number,
) {
  const wasThere = findUtxo(previous, hash, outputIndex);
  const stillThere = findUtxo(current, hash, outputIndex);
  expect(wasThere).toBeDefined();
  expect(stillThere).toBeUndefined();
}

/** Asserts the transparent pool moved by exactly `delta` (signed, zatoshis) between two syncs. */
export function assertTransparentBalanceDelta(
  previous: ZcashAccount,
  current: ZcashAccount,
  delta: BigNumber,
) {
  expect(transparentBalance(current).toFixed()).toBe(
    transparentBalance(previous).plus(delta).toFixed(),
  );
}

/** Asserts the Ironwood pool moved by exactly `delta` (signed, zatoshis) between two syncs. */
export function assertIronwoodBalanceDelta(
  previous: ZcashAccount,
  current: ZcashAccount,
  delta: BigNumber,
) {
  expect(ironwoodBalance(current).toFixed()).toBe(ironwoodBalance(previous).plus(delta).toFixed());
}
