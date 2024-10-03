import type { Account } from "@ledgerhq/types-live";

import type { Transaction } from "./types";
import { getNonce } from "./logic";

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

  const txparams = {
    address,
    nonce,
    params,
  };

  const txInputs = []
  const txOutputs = []



  const unsignedTx = {
    version: 0,
    inputs: [
      {
        previousOutpoint: {
          transactionId: "string",
          index: 0,
        },
        signatureScript: "string",
        sequence: 0,
        sigOpCount: 0,
      },
    ],
    outputs: [
      {
        amount: 0,
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: "string",
        },
      },
    ],
    lockTime: 0,
    subnetworkId: "string",
  };

  // Will likely be a call to MyCoin SDK
  return JSON.stringify(unsigned);
};
