import network from "@ledgerhq/live-network/network";
import { APINetworkInfo } from "./api-types";
import { getApiEndpoint } from "./endpoints";
import type { CardanoCoinConfig } from "../config";

export async function fetchNetworkInfo(config: CardanoCoinConfig): Promise<APINetworkInfo> {
  const res = await network({
    method: "GET",
    url: `${getApiEndpoint(config)}/v1/network/info`,
  });
  return res && (res.data as APINetworkInfo);
}
