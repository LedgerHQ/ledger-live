import network from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import { CardanoDelegation } from "../types";
import { APIDelegation } from "./api-types";
import { getApiEndpoint } from "./endpoints";
import type { CardanoCoinConfig } from "../config";

async function fetchDelegationInfo(
  config: CardanoCoinConfig,
  stakeKey: string,
): Promise<APIDelegation> {
  const res = await network({
    method: "GET",
    url: `${getApiEndpoint(config)}/v1/delegation`,
    params: {
      stakeKey,
    },
  });
  return res && res.data && (res.data.delegation as APIDelegation);
}

export async function getDelegationInfo(
  config: CardanoCoinConfig,
  stakeKey: string,
): Promise<CardanoDelegation | undefined> {
  const res = await fetchDelegationInfo(config, stakeKey);
  return (
    res && {
      status: res.status,
      deposit: res.deposit,
      poolId: res.poolInfo?.poolId,
      dRepHex: res.dRepInfo?.hex,
      ticker: res.poolInfo?.ticker,
      name: res.poolInfo?.name,
      rewards: new BigNumber(res.rewardsAvailable),
    }
  );
}
