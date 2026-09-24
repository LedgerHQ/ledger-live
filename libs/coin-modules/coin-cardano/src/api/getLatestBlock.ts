import network from "@ledgerhq/live-network/network";
import { APILatestBlock } from "./api-types";
import { getApiEndpoint } from "./endpoints";
import type { CardanoCoinConfig } from "../config";

export async function fetchLatestBlock(config: CardanoCoinConfig): Promise<APILatestBlock> {
  const res = await network({
    method: "GET",
    url: `${getApiEndpoint(config)}/v1/block/latest`,
  });
  return res && (res.data as APILatestBlock);
}
