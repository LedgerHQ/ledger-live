import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchBlockHeight } from "../api/api";

export async function lastBlock(): Promise<BlockInfo> {
  const response = await fetchBlockHeight();
  const { current_block_identifier, current_block_timestamp } = response;

  return {
    height: current_block_identifier.index,
    hash: current_block_identifier.hash,
    time: new Date(current_block_timestamp * 1000),
  };
}
