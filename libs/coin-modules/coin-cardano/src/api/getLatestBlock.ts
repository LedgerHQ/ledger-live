import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";
import { APILatestBlock } from "./api-types";

export async function fetchLatestBlock(config: CardanoCoinConfig): Promise<APILatestBlock> {
  const res = await network({
    method: "GET",
    url: `${config.api.url}/v1/block/latest`,
  });
  return res && (res.data as APILatestBlock);
}
