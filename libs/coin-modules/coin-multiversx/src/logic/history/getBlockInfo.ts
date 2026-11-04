import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { MultiversXNetworkApi } from "../../network/api";
import type { MultiversXRound } from "../../types";

export function assertBlockHeight(height: number): void {
  if (!Number.isSafeInteger(height) || height < 0) {
    throw new Error(`MultiversX block height must be a non-negative integer, got ${height}`);
  }
}

// Heights are metachain rounds: the round endpoints carry no block hash and a final round cannot be reorged
export function toBlockInfo({ round, timestamp, timestampMs }: MultiversXRound): BlockInfo {
  return {
    height: round,
    hash: String(round),
    time: new Date(timestampMs ?? timestamp * 1000),
  };
}

export async function getBlockInfo(api: MultiversXNetworkApi, height: number): Promise<BlockInfo> {
  assertBlockHeight(height);
  return toBlockInfo(await api.getRound(height));
}
