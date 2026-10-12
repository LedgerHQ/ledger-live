import { BigNumber } from "bignumber.js";
import type { BitcoinAccount, BitcoinOutput } from "@ledgerhq/live-common/families/bitcoin/types";
import { findUtxo } from "./utils";

/** The chain of change addresses of a BIP44 account. */
const CHANGE_CHAIN = 1;

export const sumOf = (utxos: BitcoinOutput[]): BigNumber =>
  utxos.reduce((sum, utxo) => sum.plus(utxo.value), new BigNumber(0));

export function assertCommonTxProperties(prev: BitcoinAccount, curr: BitcoinAccount) {
  const [latestOperation] = curr.operations;
  expect(curr.operations.length - prev.operations.length).toBe(1);
  expect(latestOperation.type).toBe("OUT");
  expect(curr.balance.toFixed()).toBe(prev.balance.minus(latestOperation.value).toFixed());
  return latestOperation;
}

/**
 * A send of `amount` outside the account: exactly one new operation, worth the amount and the fee,
 * and a balance down by exactly the amount and the fee (ADR-065, "How we would know").
 */
export function assertSent(prev: BitcoinAccount, curr: BitcoinAccount, amount: BigNumber) {
  const latestOperation = assertCommonTxProperties(prev, curr);
  expect(latestOperation.fee.isGreaterThan(0)).toBe(true);
  expect(latestOperation.value.toFixed()).toBe(amount.plus(latestOperation.fee).toFixed());
  expect(curr.balance.toFixed()).toBe(
    prev.balance.minus(amount).minus(latestOperation.fee).toFixed(),
  );
  return latestOperation;
}

export function assertUtxoExcluded(account: BitcoinAccount, hash: string, outputIndex: number) {
  const utxo = findUtxo(account, hash, outputIndex);
  expect(utxo).toBeDefined();
  expect(utxo!.isChange).toBe(false);
}

export function assertUtxoSpent(
  prev: BitcoinAccount,
  curr: BitcoinAccount,
  hash: string,
  outputIndex: number,
) {
  const wasThere = findUtxo(prev, hash, outputIndex);
  const stillThere = findUtxo(curr, hash, outputIndex);
  expect(wasThere).toBeDefined();
  expect(stillThere).toBeUndefined();
}

export function getNewChangeUtxos(prev: BitcoinAccount, curr: BitcoinAccount) {
  return curr.bitcoinResources.utxos.filter(
    utxo => !findUtxo(prev, utxo.hash, utxo.outputIndex) && utxo.isChange,
  );
}

/** The UTXOs of `prev` that `curr` no longer holds: what the send in between spent. */
export function getSpentUtxos(prev: BitcoinAccount, curr: BitcoinAccount) {
  return prev.bitcoinResources.utxos.filter(utxo => !findUtxo(curr, utxo.hash, utxo.outputIndex));
}

/**
 * The send in between returned its change to the account: one new UTXO, on an address of the
 * change chain, worth exactly what its inputs held beyond the amount and the fee.
 */
export function assertChange(
  prev: BitcoinAccount,
  curr: BitcoinAccount,
  amount: BigNumber,
  fee: BigNumber,
) {
  const changeUtxos = getNewChangeUtxos(prev, curr);
  expect(changeUtxos).toHaveLength(1);
  const [change] = changeUtxos;
  const owner = curr.bitcoinResources.accountState?.addresses.find(
    address => address.address === change.address,
  );
  expect(owner?.chain).toBe(CHANGE_CHAIN);
  expect(sumOf(getSpentUtxos(prev, curr)).toFixed()).toBe(
    amount.plus(fee).plus(change.value).toFixed(),
  );
  return change;
}
