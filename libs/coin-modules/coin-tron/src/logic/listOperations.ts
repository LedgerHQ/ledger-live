import { Operation } from "@ledgerhq/coin-framework/api/index";
import {
  defaultFetchParams,
  fetchTronAccountTxs,
  FetchTxsStopPredicate,
  getBlock,
} from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TronAsset } from "../types";

const neverStop: FetchTxsStopPredicate = () => true;

export async function listOperations(
  address: string,
  minHeight: number,
): Promise<[Operation<TronAsset>[], string]> {
  const block = await getBlock(minHeight);
  const fetchParams = block.time
    ? { ...defaultFetchParams, minTimestamp: block.time?.getTime() }
    : defaultFetchParams;
  const txs = await fetchTronAccountTxs(address, neverStop, {}, fetchParams);
  return [
    txs
      // there maybe some transactions that doesn't satisfy the minHeight condition
      // why? because fetchTronAccountTxs fetches all trc20 transactions
      //.filter(tx => (tx.blockHeight || minHeight) >= minHeight)
      // TODO: adapt directly in network calls
      .map(tx => fromTrongridTxInfoToOperation(tx, address)),
    "",
  ];
}
