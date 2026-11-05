import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { CosmosAPI } from "../../network/Cosmos";
import { assertValidBlockHeight } from "./assertValidBlockHeight";

export async function getBlockInfo(api: CosmosAPI, height: number): Promise<BlockInfo> {
  assertValidBlockHeight(height);
  return api.getBlockInfo(height);
}
