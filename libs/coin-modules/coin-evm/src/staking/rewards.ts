import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import { STAKING_CONTRACTS } from "./contracts";
import { getCoinConfig } from "../config";
import { isExternalNodeConfig } from "../network/node/types";
import { parseDecimalIntegerPart } from "../utils";
import { getCosmosAddr } from "./redelegations";
import type { RewardsStrategy } from "../types/staking";

type RewardCoin = { denom: string; amount: string };
type ValidatorReward = {
  validator_address: string;
  reward: RewardCoin[];
};
type RewardsApiResponse = { rewards: ValidatorReward[] };

async function fetchCosmosRestRewards(
  baseUrl: string,
  strategy: Extract<RewardsStrategy, { type: "cosmos-rest" }>,
  evmAddress: string,
  evmRpcUrl: string,
  precompileAddress: { address: string; abi: string },
): Promise<Map<string, bigint>> {
  const cosmosAddress = await getCosmosAddr(evmRpcUrl, precompileAddress, evmAddress);
  if (!cosmosAddress) return new Map();

  const url = `${baseUrl.replace(/\/$/, "")}${strategy.endpoint.replace("{address}", cosmosAddress)}`;

  try {
    const res = await network<RewardsApiResponse>({ url, method: "GET" });
    const result = new Map<string, bigint>();
    for (const r of res.data?.rewards ?? []) {
      let totalBase = 0n;
      for (const coin of r.reward ?? []) {
        if (coin.denom === strategy.denom) {
          totalBase += parseDecimalIntegerPart(coin.amount);
        }
      }
      if (totalBase > 0n) {
        result.set(r.validator_address, totalBase * strategy.scale);
      }
    }
    return result;
  } catch (e) {
    log("coin-evm/staking", "fetchCosmosRestRewards: REST request or response parsing failed", {
      url,
      error: e instanceof Error ? e.message : String(e),
    });
    return new Map();
  }
}

// Returns a map of `validatorAddress → amountRewarded` (in wei) per the
// chain's `rewardsStrategy`. Empty map on any failure: rewards display falls
// back to zero without blocking the staking sync.
export async function fetchRewards(
  currencyId: string,
  evmAddress: string,
): Promise<Map<string, bigint>> {
  try {
    const config = STAKING_CONTRACTS[currencyId];
    const strategy = config?.rewardsStrategy;
    if (!strategy || strategy.type === "none") return new Map();

    switch (strategy.type) {
      case "cosmos-rest": {
        const apiConfig = config.apiConfig;
        if (!apiConfig?.baseUrl || !apiConfig.precompileAddress) return new Map();
        const node = getCoinConfig(currencyId).info.node;
        const evmRpcUrl = isExternalNodeConfig(node) ? node.uri : undefined;
        if (!evmRpcUrl) return new Map();
        return await fetchCosmosRestRewards(
          apiConfig.baseUrl,
          strategy,
          evmAddress,
          evmRpcUrl,
          apiConfig.precompileAddress,
        );
      }
      default:
        return new Map();
    }
  } catch {
    return new Map();
  }
}
