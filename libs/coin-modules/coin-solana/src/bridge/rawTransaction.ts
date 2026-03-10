import { VersionedTransaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { craftRawTransaction } from "../logic/craftRawTransaction";
import { ChainAPI } from "../network";
import { Transaction } from "../types";

function buildRawTransaction(raw: string, estimatedFees: number | null): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(0),
    recipient: "",
    model: {
      kind: "raw",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "raw",
          raw,
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

export async function toLiveTransaction(
  api: ChainAPI,
  serializedTransaction: string,
  sender: string,
): Promise<Transaction> {
  await craftRawTransaction(api, serializedTransaction, sender, "", 0n);

  const tx = VersionedTransaction.deserialize(Buffer.from(serializedTransaction, "base64"));
  const estimatedFees = await api.getFeeForMessage(tx.message);

  return buildRawTransaction(serializedTransaction, estimatedFees);
}

export async function deriveRawCommandDescriptor(tx: Transaction, api: ChainAPI, sender: string) {
  if (!tx.raw) {
    throw new Error("Raw transaction is required to derive command descriptor");
  }

  const liveTx = await toLiveTransaction(api, tx.raw, sender);

  return (
    liveTx.model.commandDescriptor || {
      command: {
        kind: "raw",
        raw: tx.raw,
      },
      fee: tx.model.commandDescriptor?.fee ?? 0,
      warnings: {},
      errors: {},
    }
  );
}
