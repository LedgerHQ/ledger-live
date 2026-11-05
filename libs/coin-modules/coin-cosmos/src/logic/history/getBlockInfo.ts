import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { GetBlockInfoError } from "../../errors";
import { CosmosAPI } from "../../network/Cosmos";
import { assertValidBlockHeight } from "./assertValidBlockHeight";

export async function getBlockInfo(api: CosmosAPI, height: number): Promise<BlockInfo> {
  try {
    assertValidBlockHeight(height);
    return await api.getBlockInfo(height);
  } catch (cause) {
    throw new GetBlockInfoError(height, cause);
  }
}
