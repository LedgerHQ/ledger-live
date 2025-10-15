import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";
import { findUtxo } from "./utils";

export function assertCommonTxProperties(prev: BitcoinAccount, curr: BitcoinAccount) {
  const [latestOperation] = curr.operations;
  expect(curr.operations.length - prev.operations.length).toBe(1);
  expect(latestOperation.type).toBe("OUT");
  expect(curr.balance.toFixed()).toBe(prev.balance.minus(latestOperation.value).toFixed());
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
