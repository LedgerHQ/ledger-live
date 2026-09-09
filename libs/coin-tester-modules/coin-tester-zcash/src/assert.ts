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
