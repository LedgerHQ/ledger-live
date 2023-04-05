import { BigNumber } from "bignumber.js";
import type {
  BitcoinResourcesRaw,
  BitcoinResources,
  BitcoinInputRaw,
  BitcoinInput,
  BitcoinOutputRaw,
  BitcoinOutput,
  BitcoinAccountRaw,
  BitcoinAccount,
} from "./types";
import wallet from "./wallet-btc";
import { Account, AccountRaw } from "@ledgerhq/types-live";

export function toBitcoinInputRaw({
  address,
  value,
  previousTxHash,
  previousOutputIndex,
}: BitcoinInput): BitcoinInputRaw {
  return [
    address,
    value ? value.toString() : undefined,
    previousTxHash,
    previousOutputIndex,
  ];
}
export function fromBitcoinInputRaw([
  address,
  value,
  previousTxHash,
  previousOutputIndex,
]: BitcoinInputRaw): BitcoinInput {
  return {
    address: address || undefined,
    value: value ? new BigNumber(value) : undefined,
    previousTxHash: previousTxHash || undefined,
    previousOutputIndex,
  };
}
export function toBitcoinOutputRaw({
  hash,
  outputIndex,
  blockHeight,
  address,
  value,
  rbf,
  isChange,
}: BitcoinOutput): BitcoinOutputRaw {
  return [
    hash,
    outputIndex,
    blockHeight,
    address,
    value.toString(),
    rbf ? 1 : 0,
    isChange ? 1 : 0,
  ];
}
export function fromBitcoinOutputRaw([
  hash,
  outputIndex,
  blockHeight,
  address,
  value,
  rbf,
  isChange,
]: BitcoinOutputRaw): BitcoinOutput {
  return {
    hash,
    outputIndex,
    blockHeight: blockHeight || undefined,
    address: address || undefined,
    value: new BigNumber(value),
    rbf: !!rbf,
    isChange: !!isChange,
  };
}

export function toBitcoinResourcesRaw(
  r: BitcoinResources
): BitcoinResourcesRaw {
  return {
    utxos: r.utxos.map(toBitcoinOutputRaw),
    walletAccount:
      r.walletAccount && wallet.exportToSerializedAccountSync(r.walletAccount),
  };
}

export function fromBitcoinResourcesRaw(
  r: BitcoinResourcesRaw
): BitcoinResources {
  return {
    utxos: r.utxos.map(fromBitcoinOutputRaw),
    walletAccount:
      r.walletAccount &&
      wallet.importFromSerializedAccountSync(r.walletAccount),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
  const bitcoinAccount = account as BitcoinAccount;
  if (bitcoinAccount.bitcoinResources) {
    (accountRaw as BitcoinAccountRaw).bitcoinResources = toBitcoinResourcesRaw(
      bitcoinAccount.bitcoinResources
    );
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
  const bitcoinResourcesRaw = (accountRaw as BitcoinAccountRaw)
    .bitcoinResources;
  if (bitcoinResourcesRaw)
    (account as BitcoinAccount).bitcoinResources =
      fromBitcoinResourcesRaw(bitcoinResourcesRaw);
}
