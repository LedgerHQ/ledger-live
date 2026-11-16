import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { MultiversXNetworkApi } from "../../network/api";
import { toBlockInfo } from "./getBlockInfo";

export async function lastBlock(api: MultiversXNetworkApi): Promise<BlockInfo> {
  return toBlockInfo(await api.getLatestRound());
}
