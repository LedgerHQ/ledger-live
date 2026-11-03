import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";
import BigNumber from "bignumber.js";
import { CardanoDelegation } from "../types";
import { APIDelegation } from "./api-types";

async function fetchDelegationInfo(
  config: CardanoCoinConfig,
  stakeKey: string,
): Promise<APIDelegation> {
  const res = await network({
    method: "GET",
    url: `${config.infra.CARDANO_API_ENDPOINT}/v1/delegation`,
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
