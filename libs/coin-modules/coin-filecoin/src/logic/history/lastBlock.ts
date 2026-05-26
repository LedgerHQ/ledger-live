import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchBlockHeight } from "../../api/api";

/**
 * Returns the latest block information from the Filecoin network.
 */
export async function lastBlock(): Promise<BlockInfo> {
  const networkStatus = await fetchBlockHeight();
  const { current_block_identifier, current_block_timestamp } = networkStatus;

  return {
    height: current_block_identifier.index,
    hash: current_block_identifier.hash,
    time: new Date(current_block_timestamp * 1000),
  };
}
