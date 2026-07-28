import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import type { CacheRes } from "@ledgerhq/live-network/cache";
import { flow } from "lodash/fp";
import { getChainAPI } from "./network";
import type { ChainAPI } from "./network";
import { getValidators } from "./network/validator-app";
import type { ValidatorsAppValidator } from "./network/validator-app";
import {
  clusterByCurrencyId,
  endpointByCurrencyId,
  ledgerFirstValidators,
  profitableValidators,
} from "./utils";

// one entry per solana currency id
const VALIDATORS_CACHE = minutes(15, 3);

export async function fetchValidators(currencyId: string): Promise<ValidatorsAppValidator[]> {
  const cluster = clusterByCurrencyId(currencyId);

  if (cluster === "devnet") {
    return fetchDevnetValidators(getChainAPI({ endpoint: endpointByCurrencyId(currencyId) }));
  }

  const validators = await getValidators(cluster);

  return cluster === "mainnet-beta"
    ? flow(() => validators, profitableValidators, ledgerFirstValidators)()
    : validators;
}

export const getSolanaValidators: CacheRes<[currencyId: string], ValidatorsAppValidator[]> =
  makeLRUCache(fetchValidators, currencyId => currencyId, VALIDATORS_CACHE);

async function fetchDevnetValidators(api: ChainAPI): Promise<ValidatorsAppValidator[]> {
  const voteAccs = await api.getVoteAccounts();
  return voteAccs.current.map(acc => ({
    activeStake: acc.activatedStake,
    commission: acc.commission,
    totalScore: 0,
    voteAccount: acc.votePubkey,
  }));
}
