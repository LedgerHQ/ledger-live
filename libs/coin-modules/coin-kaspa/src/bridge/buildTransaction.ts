import { BigNumber } from "bignumber.js";

import { addressToScriptPublicKey, getFeeRate, parseExtendedPublicKey, scanUtxos } from "../logic";
import { getBlockDagInfo } from "../network";
import { calcMaxSpendableAmount } from "../logic/utxos/lib";
import { selectUtxos } from "../logic/utxos/selection";
import {
  KaspaAccount,
  KaspaHwTransaction,
  KaspaHwTransactionInput,
  KaspaHwTransactionOutput,
  Transaction,
} from "../types";

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
  if (!a.xpub) {
    throw Error("xpub is not set in the account.");
  }

  const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(a.xpub, "hex"));

  const [{ utxos: allUtxos, accountAddresses }, dagInfo] = await Promise.all([
    scanUtxos(compressedPublicKey, chainCode),
    getBlockDagInfo(),
  ]);
  // Kaspa coinbase UTXOs cannot be spent until they are 1000 blocks old (DAA maturity).
  const currentDaa = BigInt(dagInfo.virtualDaaScore);
  const COINBASE_MATURITY = 1000n;
  const utxos = allUtxos.filter(
    u =>
      !u.utxoEntry.isCoinbase ||
      currentDaa - BigInt(u.utxoEntry.blockDaaScore) >= COINBASE_MATURITY,
  );
  const recipientIsTypeECDSA: boolean = t.recipient.length > 67;
  const feerate = getFeeRate(t).toNumber();
  // For useAllAmount, compute the true sendable from the capped UTXO set (max 88 inputs) rather
  // than trusting estimateMaxSpendable which uses total balance and can exceed 88 × 50 KAS.
  const amount = t.useAllAmount
    ? calcMaxSpendableAmount(utxos, recipientIsTypeECDSA, feerate)
    : t.amount;
  const result = selectUtxos(utxos, recipientIsTypeECDSA, amount, feerate);

  const selectedUtxos = result.utxos;

  const txInputs = selectedUtxos.map(utxo => {
    return new KaspaHwTransactionInput({
      prevTxId: utxo.outpoint.transactionId,
      outpointIndex: utxo.outpoint.index,
      addressType: utxo.accountType,
      addressIndex: utxo.accountIndex,
      value: utxo.utxoEntry.amount.toNumber(),
      address: utxo.address,
    });
  });

  const changeAmount: BigNumber = result.changeAmount;

  const txOutputs = [
    new KaspaHwTransactionOutput({
      value: amount.toNumber(),
      scriptPublicKey: addressToScriptPublicKey(t.recipient),
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
    fee: result.fee.toNumber(),
  });
};
