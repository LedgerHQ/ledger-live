import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getNodeApi } from "../network/node";

async function getOperationStatus(
  currency: CryptoCurrency,
  op: Operation,
): Promise<Operation | null> {
  try {
    const nodeApi = getNodeApi(currency);
    const { blockHeight, blockHash, nonce, gasPrice, gasUsed, value } =
      await nodeApi.getTransaction(currency, op.hash);

    if (!blockHeight) {
      throw new Error("getOperationStatus: Transaction has no block");
    }

    const { timestamp } = await nodeApi.getBlockByHeight(currency, blockHeight);
    const date = new Date(timestamp);
    const fee = new BigNumber(gasPrice).multipliedBy(gasUsed);

    return {
      ...op,
      transactionSequenceNumber: new BigNumber(nonce),
      blockHash,
      blockHeight,
      date,
      fee,
      value: new BigNumber(value).plus(fee),
      subOperations: op.subOperations?.map(subOp => ({
        ...subOp,
        transactionSequenceNumber: new BigNumber(nonce),
        blockHash,
        blockHeight,
        date,
      })),
    } as Operation;
  } catch (e) {
    return null;
  }
}

export async function refreshOperations(
  currency: CryptoCurrency,
  operations: Operation[],
): Promise<Operation[]> {
  const refreshedOperationsOrNull = await Promise.all(
    operations.map(op => getOperationStatus(currency, op)),
  );

  return refreshedOperationsOrNull.filter((op): op is Operation => !!op);
}
