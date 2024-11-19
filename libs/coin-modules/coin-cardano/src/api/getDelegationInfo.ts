import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network/network";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { CardanoDelegation } from "../types";
import { APIDelegation } from "./api-types";

async function fetchDelegationInfo(
  currency: CryptoCurrency,
  stakeKey: string,
): Promise<APIDelegation> {
  const res = await network({
    method: "GET",
    url: isTestnet(currency)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/delegation`
      : `${CARDANO_API_ENDPOINT}/v1/delegation`,
    params: {
      stakeKey,
    },
  });
  return res && res.data && (res.data.delegation as APIDelegation);
}

export async function getDelegationInfo(
  currency: CryptoCurrency,
  stakeKey: string,
): Promise<CardanoDelegation | undefined> {
  const res = await fetchDelegationInfo(currency, stakeKey);
  return (
    res && {
      status: res.status,
      poolId: res.poolInfo?.poolId,
      ticker: res.poolInfo?.ticker,
      name: res.poolInfo?.name,
      rewards: new BigNumber(res.rewardsAvailable),
    }
  );
}
