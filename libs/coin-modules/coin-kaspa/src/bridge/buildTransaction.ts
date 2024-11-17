import type { Account } from "@ledgerhq/types-live";

import type { Transaction } from "./types";
import { getNonce } from "./logic";
import { AccountAddresses, scanAddresses, scanUtxos } from "../network";
import { addressToScriptPublicKey, parseExtendedPublicKey } from "../lib/kaspa-util";
import { selectUtxos } from "../lib/utxoSelection";
import { BigNumber } from "bignumber.js";

const getTransactionParams = (a: Account, t: Transaction) => {
  switch (t.mode) {
    case "send":
      return t.useAllAmount
        ? {
            method: "transferAll",
            args: {
              dest: t.recipient,
            },
          }
        : {
            method: "transfer",
            args: {
              dest: t.recipient,
              value: t.amount.toString(),
            },
          };
    default:
      throw new Error("Unknown mode in transaction");
  }
};

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (a: Account, t: Transaction) => {
  const address = a.freshAddress;
  const params = getTransactionParams(a, t);
  const nonce = getNonce(a);

  if (params.method === "transferAll") {
    throw new Error("The 'transferAll' method is not supported yet.");
  }

  // method is regular transfer now.
  const recipient = params.args.dest;
  const amount: BigNumber = params.args.value;

  const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(a.xpub, "hex"));

  const utxos = await scanUtxos(compressedPublicKey, chainCode);

  const selectedUtxos = selectUtxos(utxos, recipient.length > 67, amount, 1);

  const txInputs = selectedUtxos.map(utxo => {
    return {
      previousOutpoint: {
        transactionId: utxo.outpoint.transactionId,
        index: utxo.outpoint.index,
      },
      signatureScript: "",
      sequence: "0",
      sigOpCount: 0,
      value: utxo.utxoEntry.amount.toString(),
      addressType: utxo.accountType,
      addressIndex: utxo.accountIndex,
    };
  });

  // amount to recipient, change to nextChangeAddress
  const accountAddresses: AccountAddresses = await scanAddresses(compressedPublicKey, chainCode, 0);
  const changeAmount: BigNumber = selectedUtxos
    .reduce((sum, utxo) => {
      return sum.plus(new BigNumber(utxo.utxoEntry.amount));
    }, new BigNumber(0))
    .minus(amount);

  const txOutputs = [
    {
      amount: amount,
      scriptPublicKey: addressToScriptPublicKey(recipient),
    },
    {
      amount: changeAmount,
      scriptPublicKey: addressToScriptPublicKey(accountAddresses.nextChangeAddress.address),
      addressType: accountAddresses.nextChangeAddress.type,
      addressIndex: accountAddresses.nextChangeAddress.index,
    },
  ];

  const unsignedTx = {
    version: 0,
    inputs: txInputs,
    outputs: txOutputs,
    lockTime: 0,
    subnetworkId: "0000000000000000000000000000000000000000",
  };

  return JSON.stringify(unsignedTx);
};
