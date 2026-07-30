import network from "@ledgerhq/live-network/network";
import { getCoinConfig } from "../config";
import type { NearBlockHeader } from "./sdk.types";

type BlockQuery = { finality: "final" } | { block_id: number };

/**
 * Block header via the JSON-RPC `block` method. Only the header is requested; the chunk list in
 * the response is ignored, since reading a block's transactions would require one extra call per
 * chunk.
 */
const getBlockHeader = async (params: BlockQuery): Promise<NearBlockHeader> => {
  const currencyConfig = getCoinConfig();
  const { data } = await network<{
    result?: { header: NearBlockHeader };
    error?: { message?: string };
  }>({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "block",
      params,
    },
  });

  if (!data.result?.header) {
    throw new Error(data.error?.message || "Near: the node returned no block header");
  }

  return data.result.header;
};

export const getLastBlockHeader = (): Promise<NearBlockHeader> =>
  getBlockHeader({ finality: "final" });

/** Rejects rather than throwing synchronously, so every failure on this path is awaitable. */
export const getBlockHeaderAtHeight = async (height: number): Promise<NearBlockHeader> => {
  if (!Number.isInteger(height) || height < 0) {
    throw new Error(`Near: invalid block height ${height}`);
  }

  return getBlockHeader({ block_id: height });
};
