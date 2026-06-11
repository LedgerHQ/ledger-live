import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { fetchLatestBlock } from "../api/getLatestBlock";

export async function lastBlock(currency: CryptoCurrency): Promise<BlockInfo> {
  const { blockHeight } = await fetchLatestBlock(currency);

  // The endpoint is untyped at runtime: guard against a missing/malformed height so a
  // bad payload surfaces a clear error instead of leaking undefined/NaN/negative into
  // BlockInfo.height (which the sync engine persists as the account block height).
  if (!Number.isInteger(blockHeight) || blockHeight <= 0) {
    throw new Error(`Cardano lastBlock: invalid block height from API: ${blockHeight}`);
  }

  return {
    height: blockHeight,
    // The Ledger Cardano API's /v1/block/latest only returns the tip height, not its
    // hash. Left empty until a block-by-height endpoint exposes it (matches coin-canton,
    // the other height-only backend).
    hash: "",
    // Cardano targets ~20s between blocks, so the tip was produced within the last block
    // interval; we approximate its timestamp as "now" (matches coin-canton's lastBlock).
    // Only valid for the tip — getBlock/getBlockInfo throw rather than fake historic times.
    time: new Date(),
  };
}
