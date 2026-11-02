import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchBlockHeight } from "../network/api";
import { getBlockInfo } from "./getBlockInfo";

/** Metadata of the ledger's latest block. ICP blocks are final once the ledger appends them. */
export async function lastBlock(host: string): Promise<BlockInfo> {
  // The ledger reports its chain length; the tip is the block just below it.
  const chainLength = await fetchBlockHeight(host);
  return getBlockInfo(host, chainLength.toNumber() - 1);
}
