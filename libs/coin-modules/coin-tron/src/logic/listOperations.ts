import { Operation } from "@ledgerhq/coin-framework/api/index";
import {
  defaultFetchParams,
  fetchTronAccountTxs,
  FetchTxsStopPredicate as FetchTxsContinuePredicate,
  getBlock,
} from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TronAsset } from "../types";

export type Options = {
  // the soft limit is an indicative number of transactions to fetch
  // it is "soft" because it is not guaranteed that the number of transactions
  // returned will be less than this number, but it is guaranteed to be:
  //  <= 2 * softLimit (2 times that number)
  softLimit: number;
  minHeight: number;
  order: "asc" | "desc";
};

export const defaultOptions: Options = {
  softLimit: 1000,
  minHeight: 0,
  order: "desc",
} as const;

export async function listOperations(
  address: string,
  options: Options,
): Promise<[Operation<TronAsset>[], string]> {
  // there is a possible optimisation here: when height is 0, set the minTimestamp to 0
  const block = await getBlock(options.minHeight);
  const minTimestamp = block.time?.getTime() ?? defaultFetchParams.minTimestamp;
  const fetchParams = {
    ...defaultFetchParams,
    minTimestamp: minTimestamp,
    order: options.order,
    hintGlobalLimit: options.softLimit,
  };

  // under the hood, the network fetches native transactions and trc20 transactions separately
  // that same predicate is used to stop fetching both calls
  // that's why we have a "soft" limit, with the guarantee of total number of transactions to be less than 2 * softLimit
  const untilLimitReached: FetchTxsContinuePredicate = ops => ops.length < options.softLimit;

  const txs = await fetchTronAccountTxs(address, untilLimitReached, {}, fetchParams);
  return [
    txs
      // TODO: adapt directly in network calls
      .map(tx => fromTrongridTxInfoToOperation(tx, address)),
    "",
  ];
}
