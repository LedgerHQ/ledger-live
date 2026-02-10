import { VersionedTransaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { ChainAPI } from "./network";
import { Transaction } from "./types";

function buildRawTransaction(
  raw: string,
  estimatedFees: number | null,
  templateId?: string,
): Transaction {
  return {
    ...(templateId ? { templateId } : {}),
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
  templateId?: string,
): Promise<Transaction> {
  const solanaTransaction = VersionedTransaction.deserialize(
    Buffer.from(serializedTransaction, "base64"),
  );

  const estimatedFees = await api.getFeeForMessage(solanaTransaction.message);

  return buildRawTransaction(serializedTransaction, estimatedFees, templateId);
}

export async function deriveRawCommandDescriptor(tx: Transaction, api: ChainAPI) {
  if (!tx.raw) {
    throw new Error("Raw transaction is required to derive command descriptor");
  }

  const liveTx = await toLiveTransaction(api, tx.raw);

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
