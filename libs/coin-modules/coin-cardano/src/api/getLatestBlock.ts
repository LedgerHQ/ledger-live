import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { APILatestBlock } from "./api-types";

export async function fetchLatestBlock(config: CardanoCoinConfig): Promise<APILatestBlock> {
  const res = await network({
    method: "GET",
    url: isTestnet(config)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/block/latest`
      : `${CARDANO_API_ENDPOINT}/v1/block/latest`,
  });
  return res && (res.data as APILatestBlock);
}
