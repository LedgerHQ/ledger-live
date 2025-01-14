import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import network from "@ledgerhq/live-network";
import { aptosCoinConfig } from "../config";
import { Block } from "@aptos-labs/ts-sdk";

export async function lastBlock(): Promise<BlockInfo> {
  const response = await network<Block>({
    method: "GET",
    url: aptosCoinConfig.node.fullnode,
  });

  const data = response.data;

  return {
    height: parseInt(data.block_height),
  };
}
