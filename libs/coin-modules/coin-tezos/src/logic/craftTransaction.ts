import { OpKind, type OperationContents } from "@taquito/rpc";
import { DEFAULT_FEE } from "@taquito/taquito";
import coinConfig from "../config";
import { UnsupportedTransactionMode } from "../types/errors";
import { getTezosToolkit } from "./tezosToolkit";

export type TransactionFee = {
  fees?: string;
  gasLimit?: string;
  storageLimit?: string;
};
export type TransactionType = "OUT" | "DELEGATE" | "UNDELEGATE";

export async function craftTransaction(
  account: {
    address: string;
    counter?: number;
  },
  transaction: {
    type: "send" | "delegate" | "undelegate";
    recipient: string;
    amount: bigint;
    fee: TransactionFee;
  },
  publicKey?: {
    publicKey: string;
    publicKeyHash: string;
  },
): Promise<{ type: TransactionType; contents: OperationContents[] }> {
  const { address } = account;

  const transactionFees = {
    fee: transaction.fee.fees ?? "0",
    gas_limit: transaction.fee.gasLimit ?? "0",
    storage_limit: transaction.fee.storageLimit ?? "0",
  };

  const tezosToolkit = getTezosToolkit();

  const sourceData = await tezosToolkit.rpc.getContract(address);
  const counter = account.counter ?? Number(sourceData.counter);

  const contents: OperationContents[] = [];

  if (publicKey !== undefined) {
    const revealFees = await tezosToolkit.estimate.reveal();
    const minRevealGasLimit = coinConfig.getCoinConfig().fees.minRevealGasLimit;
    const revealGasLimit = Math.max(revealFees?.gasLimit || 0, minRevealGasLimit);
    contents.push({
      kind: OpKind.REVEAL,
      fee: DEFAULT_FEE.REVEAL.toString(),
      //TODO: use instead of previous line when this PR will be validated, as the value change (don't forget to update the test too)
      // fee: getRevealFee(address).toString(),
      gas_limit: revealGasLimit.toString(),
      storage_limit: (revealFees?.storageLimit || 0).toString(),
      source: publicKey.publicKeyHash,
      counter: (counter + 1 + contents.length).toString(),
      public_key: publicKey.publicKey,
    });
  }

  let type: TransactionType;
  switch (transaction.type) {
    case "send": {
      type = "OUT";
      contents.push({
        kind: OpKind.TRANSACTION,
        amount: transaction.amount.toString(),
        destination: transaction.recipient,
        source: address,
        counter: (counter + 1 + contents.length).toString(),
        ...transactionFees,
      });
      break;
    }
    case "delegate": {
      type = "DELEGATE";
      contents.push({
        kind: OpKind.DELEGATION,
        source: address,
        counter: (counter + 1 + contents.length).toString(),
        delegate: transaction.recipient,
        ...transactionFees,
      });
      break;
    }
    case "undelegate": {
      // we undelegate as there's no "delegate" field
      // OpKind is still "DELEGATION"
      type = "UNDELEGATE";
      contents.push({
        kind: OpKind.DELEGATION,
        source: address,
        counter: (counter + 1).toString(),
        ...transactionFees,
      });
      break;
    }
    default:
      throw new UnsupportedTransactionMode("unsupported mode", { mode: transaction.type });
  }

  return { type, contents };
}

/**
 * Return transaction in raw encoded format (i.e. hexa)
 */
export async function rawEncode(contents: OperationContents[]): Promise<string> {
  const tezosToolkit = getTezosToolkit();

  const block = await tezosToolkit.rpc.getBlock();
  const forgedBytes = await tezosToolkit.rpc.forgeOperations({
    branch: block.hash,
    contents,
  });

  return forgedBytes;
}
