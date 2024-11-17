import type { Account } from "@ledgerhq/types-live";

import { AccountAddresses, scanAddresses, scanUtxos } from "../network";
import { addressToScriptPublicKey, parseExtendedPublicKey } from "../lib/kaspa-util";
import { selectUtxos } from "../lib/utxoSelection";
import { BigNumber } from "bignumber.js";

import { Transaction } from "../types/bridge";
import { KaspaHwTransaction, TransactionInput, TransactionOutput } from "./kaspaHwTransaction";

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (a: Account, t: Transaction): Promise<KaspaHwTransaction> => {
  const recipient = t.recipient;
  const amount: BigNumber = t.amount;

  if (!a.xpub) {
    throw Error("xpub is not set in the account.");
  }

  const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(a.xpub, "hex"));

  const utxos = await scanUtxos(compressedPublicKey, chainCode);
  const selectedUtxos = selectUtxos(utxos, recipient.length > 67, amount, 1);

  const txInputs = selectedUtxos.map(utxo => {
    return new TransactionInput({
      prevTxId: utxo.outpoint.transactionId,
      outpointIndex: utxo.outpoint.index,
      addressType: utxo.accountType,
      addressIndex: utxo.accountIndex,
      value: utxo.utxoEntry.amount.toNumber(),
    });
  });

  // amount to recipient, change to nextChangeAddress
  const accountAddresses: AccountAddresses = await scanAddresses(compressedPublicKey, chainCode, 0);
  const changeAmount: BigNumber = selectedUtxos
    .reduce((sum, utxo) => {
      return sum.plus(new BigNumber(utxo.utxoEntry.amount));
    }, new BigNumber(0))
    .minus(amount);

  const txOutputs = [
    new TransactionOutput({
      value: amount.toNumber(),
      scriptPublicKey: addressToScriptPublicKey(recipient),
    }),
    new TransactionOutput({
      value: changeAmount.toNumber(),
      scriptPublicKey: addressToScriptPublicKey(accountAddresses.nextChangeAddress.address),
    }),
  ];

  return new KaspaHwTransaction({
    inputs: txInputs,
    outputs: txOutputs,
    version: 0,
    changeAddressType: accountAddresses.nextChangeAddress.type,
    changeAddressIndex: accountAddresses.nextChangeAddress.index,
    account: a.index,
  });
};
