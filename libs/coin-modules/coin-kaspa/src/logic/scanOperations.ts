import { Operation, OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getAllTransactions } from "./getAllTransactions";

export async function scanOperations(
  addresses: string[],
  accountId: string,
  afterValue: number = 1,
): Promise<Operation[]> {
  const operations: Operation[] = [];

  const fetchedTxs = await Promise.all(
    addresses.map(addr => getAllTransactions(addr, afterValue)),
  ).then(results => results.flat());

  for (const tx of fetchedTxs) {
    const myInputAmount: BigNumber = tx.inputs.reduce((acc: BigNumber, v): BigNumber => {
      if (addresses.includes(v.previous_outpoint_address)) {
        return acc.plus(BigNumber(v.previous_outpoint_amount));
      }
      return acc;
    }, BigNumber(0));

    const myOutputAmount: BigNumber = tx.outputs.reduce((acc: BigNumber, v) => {
      if (addresses.includes(v.script_public_key_address)) {
        return acc.plus(BigNumber(v.amount));
      }
      return acc;
    }, BigNumber(0));

    const totalOutputAmount: BigNumber = tx.outputs.reduce(
      (acc: BigNumber, v) => acc.plus(BigNumber(v.amount)),
      BigNumber(0),
    );
    const totalInputAmount: BigNumber = tx.inputs.reduce(
      (acc: BigNumber, v) => acc.plus(BigNumber(v.previous_outpoint_amount)),
      BigNumber(0),
    );

    const operationType: OperationType = myOutputAmount.gt(myInputAmount) ? "IN" : "OUT";

    operations.push({
      id: tx.transaction_id,
      hash: tx.transaction_id,
      type: operationType,
      value: myOutputAmount.minus(myInputAmount).absoluteValue(),
      fee: totalInputAmount.minus(totalOutputAmount),
      senders: tx.inputs.map(inp => inp.previous_outpoint_address),
      recipients: tx.outputs.map(output => output.script_public_key_address),
      blockHeight: tx.accepting_block_blue_score,
      blockHash: tx.block_hash[0],
      accountId: accountId,
      date: new Date(tx.block_time),
      extra: {},
    } as Operation);
  }

  return operations;
}
