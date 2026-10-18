import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { APINetworkInfo } from "./api-types";

export async function fetchNetworkInfo(config: CardanoCoinConfig): Promise<APINetworkInfo> {
  const res = await network({
    method: "GET",
    url: isTestnet(config)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/network/info`
      : `${CARDANO_API_ENDPOINT}/v1/network/info`,
  });
  return res && (res.data as APINetworkInfo);
}
