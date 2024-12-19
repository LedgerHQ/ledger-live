import { scanUtxos } from "../network";
import { addressToScriptPublicKey, parseExtendedPublicKey } from "../lib/kaspa-util";
import { selectUtxos, UtxoStrategy } from "../lib/utxoSelection";
import { BigNumber } from "bignumber.js";

import { KaspaHwTransaction, KaspaHwTransactionInput, KaspaHwTransactionOutput } from "./kaspaHwTransaction";
import { KaspaAccount, Transaction } from "../types/bridge";

/**
 * Assembles a transaction for the Kaspa network.
 *
 * This function prepares a Kaspa transaction for a given account and transaction details.
 * It performs the necessary steps to construct the transaction inputs and outputs, including
 * scanning for unspent transaction outputs (UTXOs), selecting the appropriate UTXOs, and calculating
 * change amounts. It also ensures the account's extended public key is set before proceeding.
 *
 * @param {KaspaAccount} a - The account from which the transaction will be initiated, including an extended public key (xpub).
 * @param {Transaction} t - The transaction details, which include the recipient's address and the amount to be transferred.
 * @returns {Promise<KaspaHwTransaction>} A promise that resolves to the prepared hardware transaction object.
 * @throws Will throw an error if the account's extended public key (xpub) is not set.
 */
export const buildTransaction = async (
  a: KaspaAccount,
  t: Transaction,
): Promise<KaspaHwTransaction> => {
  const recipient = t.recipient;
  const amount: BigNumber = t.amount;

  if (!a.xpub) {
    throw Error("xpub is not set in the account.");
  }

  const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(a.xpub, "hex"));

  const { utxos, accountAddresses } = await scanUtxos(compressedPublicKey, chainCode);
  const recipientIsTypeECDSA: boolean = recipient.length > 67;
  const result = selectUtxos(
    utxos,
    UtxoStrategy.FIFO,
    recipientIsTypeECDSA,
    amount,
    t.feerate || 1,
  );

  const selectedUtxos = result.utxos;

  const txInputs = selectedUtxos.map(utxo => {
    return new KaspaHwTransactionInput({
      prevTxId: utxo.outpoint.transactionId,
      outpointIndex: utxo.outpoint.index,
      addressType: utxo.accountType,
      addressIndex: utxo.accountIndex,
      value: utxo.utxoEntry.amount.toNumber(),
    });
  });

  const changeAmount: BigNumber = result.changeAmount;

  const txOutputs = [
    new KaspaHwTransactionOutput({
      value: amount.toNumber(),
      scriptPublicKey: addressToScriptPublicKey(recipient),
    }),
  ];

  if (changeAmount.isGreaterThan(0)) {
    txOutputs.push(
      new KaspaHwTransactionOutput({
        value: changeAmount.toNumber(),
        scriptPublicKey: addressToScriptPublicKey(accountAddresses.nextChangeAddress.address),
      }),
    );
  }

  return new KaspaHwTransaction({
    inputs: txInputs,
    outputs: txOutputs,
    version: 0,
    changeAddressType: accountAddresses.nextChangeAddress.type,
    changeAddressIndex: accountAddresses.nextChangeAddress.index,
    account: 0x80000000 + a.index, // account is hardened
  });
};
