import get from "lodash/get";
import { BigNumber } from "bignumber.js";
import { type AccountInfo, getTronResources as getTronResourcesLogic } from "./logic/utils";
import { accountNamesCache, getTronAccountNetwork, getUnwithdrawnReward } from "./network";
import { encode58Check } from "./network/format";
import type {
  BandwidthInfo,
  NetworkInfo,
  TronAccount,
  TronResources,
  TrongridTxInfo,
} from "./types";

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

function extractBandwidthInfo(networkInfo: NetworkInfo | null | undefined): BandwidthInfo {
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

export async function getTronResources(
  acc: AccountInfo & { address: string },
  txs?: TrongridTxInfo[],
): Promise<TronResources> {
  const encodedAddress = encode58Check(acc.address);
  const tronNetworkInfo = await getTronAccountNetwork(encodedAddress);
  const unwithdrawnReward = await getUnwithdrawnReward(encodedAddress);
  const energy = tronNetworkInfo.energyLimit.minus(tronNetworkInfo.energyUsed);
  const bandwidth = extractBandwidthInfo(tronNetworkInfo);

  // TODO: rely on the account object when trongrid will provide this info.
  const getLastVotedDate = (txs: TrongridTxInfo[]): Date | null | undefined => {
    const lastOp = txs.find(({ type }) => type === "VoteWitnessContract");
    return lastOp ? lastOp.date : null;
  };
  const lastVotedDate = txs ? getLastVotedDate(txs) : undefined;

  const rawVotes = get(acc, "votes", []).sort((a, b) => b.vote_count - a.vote_count);
  const votes = await Promise.all(
    rawVotes.map(async v => ({
      name: await accountNamesCache(v.vote_address),
      address: v.vote_address,
      voteCount: v.vote_count,
    })),
  );

  return {
    ...getTronResourcesLogic(acc),
    votes,
    energy,
    bandwidth,
    unwithdrawnReward,
    lastVotedDate,
  };
}

export function isAccountEmpty({ tronResources }: Pick<TronAccount, "tronResources">) {
  // tronResources may be absent on accounts synced via the generic adapter before enrichment.
  // Treat as non-empty so the account is not silently dropped from scan results.
  if (!tronResources) return false;
  return tronResources.bandwidth.freeLimit.eq(0);
}
