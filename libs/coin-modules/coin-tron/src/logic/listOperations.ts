import { Operation } from "@ledgerhq/coin-framework/api/index";
import { fetchTronAccountTxs } from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TronAsset } from "../types";

export async function listOperations(address: string): Promise<[Operation<TronAsset>[], string]> {
  // TODO: do not use 1000 as a limit, but depending on account state
  const txs = await fetchTronAccountTxs(address, txs => txs.length < 1000, {});
  // TODO: adapt directly in network calls
  return [txs.map(tx => fromTrongridTxInfoToOperation(tx, address)), ""];
}
