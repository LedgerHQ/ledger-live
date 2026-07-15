import { promiseAllBatched } from "@ledgerhq/live-promise";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { ApiResponseTransaction } from "../../types";
import { getAllTransactions } from "./getAllTransactions";

const FETCH_CONCURRENCY = 5;

/**
 * Map a single Kaspa indexer transaction into a legacy (`@ledgerhq/types-live`) Operation from
 * the perspective of `addressSet` (the account's own addresses). Shared by `scanOperations`
 * (legacy bridge, full account-history scan) and `listOperations` (Alpaca API, single indexer
 * page) so the amount/fee/type computation can't drift between the two consumers.
 */
export function transactionToOperation(
  tx: ApiResponseTransaction,
  addressSet: Set<string>,
  accountId: string,
): Operation {
  const inputs = tx.inputs ?? [];
  const outputs = tx.outputs ?? [];

  const myInputAmount: BigNumber = inputs.reduce((acc: BigNumber, v): BigNumber => {
    if (addressSet.has(v.previous_outpoint_address)) {
      return acc.plus(BigNumber(v.previous_outpoint_amount));
    }
    return acc;
  }, BigNumber(0));

  const myOutputAmount: BigNumber = outputs.reduce((acc: BigNumber, v) => {
    if (addressSet.has(v.script_public_key_address)) {
      return acc.plus(BigNumber(v.amount));
    }
    return acc;
  }, BigNumber(0));

  const totalOutputAmount: BigNumber = outputs.reduce(
    (acc: BigNumber, v) => acc.plus(BigNumber(v.amount)),
    BigNumber(0),
  );
  const totalInputAmount: BigNumber = inputs.reduce(
    (acc: BigNumber, v) => acc.plus(BigNumber(v.previous_outpoint_amount)),
    BigNumber(0),
  );

  const operationType: OperationType = myOutputAmount.gt(myInputAmount) ? "IN" : "OUT";

  return {
    id: tx.transaction_id,
    hash: tx.transaction_id,
    type: operationType,
    // For OUT, inputs (yours) minus outputs (your change) nets out to the amount sent to the
    // recipient PLUS the network fee (change already excludes both); for IN it's simply the
    // received amount. This value is therefore already "amount + fees" for OUT operations.
    value: myOutputAmount.minus(myInputAmount).absoluteValue(),
    fee: inputs.length > 0 ? totalInputAmount.minus(totalOutputAmount) : BigNumber(0),
    senders: inputs.map(inp => inp.previous_outpoint_address),
    recipients: outputs.map(output => output.script_public_key_address),
    blockHeight: tx.accepting_block_blue_score,
    blockHash: tx.block_hash[0],
    accountId: accountId,
    date: new Date(tx.block_time),
    extra: {},
  } as Operation;
}

export async function scanOperations(
  addresses: string[],
  accountId: string,
  afterValue: number = 1,
): Promise<Operation[]> {
  const operations: Operation[] = [];

  const addressSet = new Set(addresses);

  const fetchedTxs = (
    await promiseAllBatched(FETCH_CONCURRENCY, addresses, addr =>
      getAllTransactions(addr, afterValue),
    )
  ).flat();

  for (const tx of fetchedTxs) {
    operations.push(transactionToOperation(tx, addressSet, accountId));
  }

  return operations;
}
