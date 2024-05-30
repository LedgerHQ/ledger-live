import { OpKind, type OperationContents } from "@taquito/rpc";
import type { OperationType } from "@ledgerhq/types-live";
import type { TezosAccount, Transaction } from "../types";

export async function buildTransaction(
  account: TezosAccount,
  transaction: Transaction,
  counter: number,
): Promise<{ type: OperationType; content: OperationContents }> {
  const { freshAddress } = account;

  const transactionFees = {
    fee: (transaction.fees || 0).toString(),
    gas_limit: (transaction.gasLimit || 0).toString(),
    storage_limit: (transaction.storageLimit || 0).toString(),
  };

  switch (transaction.mode) {
    case "send": {
      return {
        type: "OUT",
        content: {
          kind: OpKind.TRANSACTION,
          amount: transaction.amount.toString(),
          destination: transaction.recipient,
          source: freshAddress,
          counter: (counter + 1).toString(),
          ...transactionFees,
        },
      };
    }
    case "delegate": {
      return {
        type: "DELEGATE",
        content: {
          kind: OpKind.DELEGATION,
          source: freshAddress,
          counter: (counter + 1).toString(),
          delegate: transaction.recipient,
          ...transactionFees,
        },
      };
    }
    case "undelegate": {
      // we undelegate as there's no "delegate" field
      // OpKind is still "DELEGATION"
      return {
        type: "UNDELEGATE",
        content: {
          kind: OpKind.DELEGATION,
          source: freshAddress,
          counter: (counter + 1).toString(),
          ...transactionFees,
        },
      };

      break;
    }
    default:
      throw new Error("not supported");
  }
}
