import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { type PolkadotCoinConfig } from "../config";
import api from "../network";
import { toBlockInfo } from "./getBlock";

export async function getBlockInfo(config: PolkadotCoinConfig, height: number): Promise<BlockInfo> {
  return toBlockInfo(await api.getBlock(config, height));
}
