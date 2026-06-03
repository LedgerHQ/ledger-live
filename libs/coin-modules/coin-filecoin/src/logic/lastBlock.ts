// Returns the best known block from the Filecoin REST API.
// The /network/status endpoint returns current_block_identifier which is the
// best (non-finalized) tip. Finality on Filecoin is probabilistic; the bridge
// already applies a 1200-block safe-delta in getAccountShape. We follow the
// same convention and let callers handle the safety delta if needed.
import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchBlockHeight } from "../api/api";

export async function lastBlock(): Promise<BlockInfo> {
  const status = await fetchBlockHeight();
  const { index, hash } = status.current_block_identifier;
  return {
    height: index,
    hash,
    time: new Date(status.current_block_timestamp),
  };
}
