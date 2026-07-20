import { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosAPI } from "../../network/Cosmos";

export async function lastBlock(api: CosmosAPI): Promise<BlockInfo> {
  return api.getLatestBlockInfo();
}
