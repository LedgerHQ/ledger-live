import network from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import { APIGetPoolList, APIGetPoolsDetail } from "./api-types";
import { getApiEndpoint } from "./endpoints";
import type { CardanoCoinConfig } from "../config";

export async function fetchPoolList(
  config: CardanoCoinConfig,
  search: string,
  pageNo: number,
  limit: number,
): Promise<APIGetPoolList> {
  const res = await network({
    method: "GET",
    url: `${getApiEndpoint(config)}/v1/pool/list`,
    params: { search, pageNo, limit },
  });
  return res && (res.data as APIGetPoolList);
}

export async function fetchPoolDetails(
  config: CardanoCoinConfig,
  poolIds: Array<string>,
): Promise<APIGetPoolsDetail> {
  const { data } = await network<APIGetPoolsDetail>({
    method: "GET",
    url: `${getApiEndpoint(config)}/v1/pool/detail`,
    params: { poolIds },
  });

  const sortedPools = [...data.pools].sort((a, b) => {
    const stakeA = new BigNumber(a.liveStake);
    const stakeB = new BigNumber(b.liveStake);
    if (stakeA.isLessThan(stakeB)) {
      return -1;
    }
    if (stakeA.isGreaterThan(stakeB)) {
      return 1;
    }
    return 0;
  });

  return { ...data, pools: sortedPools };
}
