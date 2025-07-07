import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { setHederaPreloadData } from "./preload-data";
import { HederaPreloadData, HederaValidator } from "./types";
import { getNodes } from "./api/mirror";
import BigNumber from "bignumber.js";
import { extractCompanyFromNodeDescription } from "./logic";

export const getPreloadStrategy = () => ({
  preloadMaxAge: 15 * 60 * 1000, // 15 minutes
});

export async function preload(currency: CryptoCurrency): Promise<HederaPreloadData> {
  const nodes = await getNodes();

  const validators: HederaValidator[] = nodes.map(mirrorNode => {
    const minStake = new BigNumber(mirrorNode.min_stake);
    const maxStake = new BigNumber(mirrorNode.max_stake);
    const activeStake = new BigNumber(mirrorNode.stake);
    const activeStakePercentage = maxStake.gt(0)
      ? activeStake.dividedBy(maxStake).multipliedBy(100).dp(0, BigNumber.ROUND_DOWN)
      : new BigNumber(0);

    return {
      nodeId: mirrorNode.node_id,
      address: mirrorNode.node_account_id,
      name: extractCompanyFromNodeDescription(mirrorNode.description),
      minStake,
      maxStake,
      activeStake,
      activeStakePercentage,
      overstaked: activeStake.gte(maxStake),
    };
  });

  const data: HederaPreloadData = {
    validators,
  };

  setHederaPreloadData(data, currency);

  return data;
}

export function hydrate(data: HederaPreloadData, currency: CryptoCurrency): void {
  setHederaPreloadData(data, currency);
}
