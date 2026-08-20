import { BigNumber } from "bignumber.js";
import get from "lodash/get";
import type { TronCoinConfig } from "../config";
import { accountNamesCache, getTronAccountNetwork, getUnwithdrawnReward } from "../network";
import { encode58Check } from "../network/format";
import type { BandwidthInfo, NetworkInfo, TronResources } from "../types";
import { type AccountInfo, getTronResources } from "./utils";

export const defaultTronResources: TronResources = {
  frozen: {
    bandwidth: undefined,
    energy: undefined,
  },
  unFrozen: {
    bandwidth: undefined,
    energy: undefined,
  },
  delegatedFrozen: {
    bandwidth: undefined,
    energy: undefined,
  },
  legacyFrozen: {
    bandwidth: undefined,
    energy: undefined,
  },
  votes: [],
  tronPower: 0,
  energy: new BigNumber(0),
  bandwidth: {
    freeUsed: new BigNumber(0),
    freeLimit: new BigNumber(0),
    gainedUsed: new BigNumber(0),
    gainedLimit: new BigNumber(0),
  },
  unwithdrawnReward: new BigNumber(0),
  lastWithdrawnRewardDate: undefined,
  lastVotedDate: undefined,
};

export function extractBandwidthInfo(networkInfo: NetworkInfo | null | undefined): BandwidthInfo {
  if (networkInfo) {
    const { freeNetUsed, freeNetLimit, netUsed, netLimit } = networkInfo;
    return {
      freeUsed: freeNetUsed,
      freeLimit: freeNetLimit,
      gainedUsed: netUsed,
      gainedLimit: netLimit,
    };
  }

  return {
    freeUsed: new BigNumber(0),
    freeLimit: new BigNumber(0),
    gainedUsed: new BigNumber(0),
    gainedLimit: new BigNumber(0),
  };
}

/**
 * The full `tronResources` for an account: the synchronous parts derived from the account payload
 * (`logic/utils.ts:getTronResources`) plus the three pieces that need their own network calls —
 * available energy/bandwidth, the unwithdrawn reward, and super-representative display names.
 *
 * `acc.address` is the **hex** address as returned by TronGrid, not base58 (see network/types.ts).
 */
export async function fetchTronResources(
  config: TronCoinConfig,
  acc: AccountInfo & { address: string },
): Promise<TronResources> {
  const encodedAddress = encode58Check(acc.address);
  const tronNetworkInfo = await getTronAccountNetwork(config, encodedAddress);
  const unwithdrawnReward = await getUnwithdrawnReward(config, encodedAddress);
  const energy = tronNetworkInfo.energyLimit.minus(tronNetworkInfo.energyUsed);
  const bandwidth = extractBandwidthInfo(tronNetworkInfo);

  const rawVotes = [...get(acc, "votes", [])].sort((a, b) => b.vote_count - a.vote_count);
  const votes = await Promise.all(
    rawVotes.map(async v => ({
      name: await accountNamesCache(config, v.vote_address),
      address: v.vote_address,
      voteCount: v.vote_count,
    })),
  );

  return {
    ...getTronResources(acc),
    votes,
    energy,
    bandwidth,
    unwithdrawnReward,
    // TronGrid exposes no last-vote timestamp (TODO(LIVE-32774)), and it is only recoverable by
    // scanning the operation list, which this function does not fetch. The wallet reads it off the
    // newest VOTE operation instead (`families/tron/react.ts:getLastVotedDate`).
    lastVotedDate: undefined,
  };
}
