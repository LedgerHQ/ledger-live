import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { APIGetDRepList } from "./api-types";

export async function fetchDRepList(
  config: CardanoCoinConfig,
  search: string,
  pageNo: number,
  limit: number,
): Promise<APIGetDRepList> {
  const res = await network({
    method: "GET",
    url: isTestnet(config)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/dRep/list`
      : `${CARDANO_API_ENDPOINT}/v1/dRep/list`,
    params: { search, pageNo, limit },
  });

  return res && (res.data as APIGetDRepList);
}
