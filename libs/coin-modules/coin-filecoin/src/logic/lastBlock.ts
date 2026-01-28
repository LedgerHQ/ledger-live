import { fetchBlockHeight } from "../network/api";
import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";

/**
 * Get the current block height from the Filecoin network.
 *
 * @returns BlockInfo with current height
 */
export async function lastBlock(): Promise<BlockInfo> {
  const status = await fetchBlockHeight();
  return {
    height: status.current_block_identifier.index,
    hash: status.current_block_identifier.hash,
  };
}
