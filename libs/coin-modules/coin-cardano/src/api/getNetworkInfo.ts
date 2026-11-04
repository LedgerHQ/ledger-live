import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";
import { APINetworkInfo } from "./api-types";

export async function fetchNetworkInfo(config: CardanoCoinConfig): Promise<APINetworkInfo> {
  const res = await network({
    method: "GET",
    url: `${config.infra.CARDANO_API_ENDPOINT}/v1/network/info`,
  });
  return res && (res.data as APINetworkInfo);
}
