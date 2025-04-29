import { Operation } from "@ledgerhq/coin-framework/api/index";
import { fetchTronAccountTxs, FetchTxsStopPredicate, getBlock } from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TronAsset } from "../types";
import { WithBlockAPI } from "../network/types";

function fetchUntilTimestamp(minTimestamp: number): FetchTxsStopPredicate {
  return txs => {
    // note: would be nice if we could use the blockHeight here
    // but looks like unavaible on MalformedTransactionTronAPI
    const withBlocks = txs as Array<WithBlockAPI>;
    return withBlocks.find(tx => tx.block_timestamp <= minTimestamp) == undefined;
  };
}

const neverStop: FetchTxsStopPredicate = () => true;

export async function listOperations(
  address: string,
  minHeight: number,
): Promise<[Operation<TronAsset>[], string]> {
  const block = await getBlock(minHeight);
  const shouldFetchMoreTxs = block.time ? fetchUntilTimestamp(block.time.getTime()) : neverStop;
  const txs = await fetchTronAccountTxs(address, shouldFetchMoreTxs, {});
  return [
    txs
      // there maybe some transactions that doesn't satisfy the minHeight condition
      // why? because the stop predicate of `fetchTronAccountTxs` use a rough predicate on all aggregated operations so far
      .filter(tx => (tx.blockHeight || minHeight) >= minHeight)
      // TODO: adapt directly in network calls
      .map(tx => fromTrongridTxInfoToOperation(tx, address)),
    "",
  ];
}
