import { Operation } from "@ledgerhq/coin-framework/api/index";
import {
  defaultFetchParams,
  fetchTronAccountTxs,
  FetchTxsStopPredicate as FetchTxsContinuePredicate,
  getBlock,
} from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TronAsset } from "../types";

const neverStop: FetchTxsContinuePredicate = () => true;

export async function listOperations(
  address: string,
  minHeight: number,
): Promise<[Operation<TronAsset>[], string]> {
  // there is a possible optimisation here: when height is 0, set the minTimestamp to 0
  const block = await getBlock(minHeight);
  const fetchParams = block.time
    ? { ...defaultFetchParams, minTimestamp: block.time?.getTime() }
    : defaultFetchParams;
  const txs = await fetchTronAccountTxs(address, neverStop, {}, fetchParams);
  return [
    txs
      // TODO: adapt directly in network calls
      .map(tx => fromTrongridTxInfoToOperation(tx, address)),
    "",
  ];
}
