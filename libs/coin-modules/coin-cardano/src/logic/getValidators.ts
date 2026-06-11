import type { Page, Validator } from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EpochInfo, StakePool } from "../api/api-types";
import { fetchEpochInfo } from "../api/getEpochInfo";
import { fetchPoolList } from "../api/getPools";
import { computePoolApy } from "./computePoolApy";

const PAGE_LIMIT = 100;

function toValidator(pool: StakePool, epoch: EpochInfo | undefined): Validator | undefined {
  // Skip a pool whose liveStake can't be parsed rather than letting one bad row throw and
  // empty the whole list (the consumer falls back to [] on any error).
  let balance: bigint;
  try {
    balance = BigInt(pool.liveStake);
  } catch {
    return undefined;
  }

  // description/logo omitted: not exposed by /v1/pool/list. APY is computed from the current-epoch
  // params (ADR-038) and only set when non-zero — so it stays omitted until the params endpoint
  // serves reserves + active stake (LIVE-18622), at which point healthy pools get a real value.
  const validator: Validator = {
    address: pool.poolId,
    name: pool.name ?? pool.ticker ?? pool.poolId,
    balance,
    commissionRate: pool.margin,
  };
  if (pool.website) validator.url = pool.website;
  if (epoch) {
    const apy = computePoolApy(pool, epoch);
    if (apy > 0) validator.apy = apy;
  }
  return validator;
}

async function fetchAllPools(currency: CryptoCurrency): Promise<StakePool[]> {
  const pools: StakePool[] = [];
  let pageNo = 1;
  let total = 0;
  do {
    const res = await fetchPoolList(currency, "", pageNo, PAGE_LIMIT);
    pools.push(...res.pools);
    total = res.count;
    pageNo += 1;
    if (res.pools.length === 0) break; // safety: stop if a page returns nothing
  } while (pools.length < total);
  return pools;
}

/**
 * All Cardano stake pools, mapped to framework validators. Returns the full set in a single
 * page (next: undefined) — the generic-coin-framework consumer reads one page and does not
 * follow a cursor, so every pool from /v1/pool/list is paged in here. The current-epoch params
 * are fetched once in parallel for APY; a failure there degrades to validators without APY
 * rather than failing the whole list.
 */
export async function getValidators(currency: CryptoCurrency): Promise<Page<Validator>> {
  const [pools, epoch] = await Promise.all([
    fetchAllPools(currency),
    fetchEpochInfo(currency).catch(() => undefined),
  ]);

  const items = pools.flatMap(pool => toValidator(pool, epoch) ?? []);
  return { items, next: undefined };
}
