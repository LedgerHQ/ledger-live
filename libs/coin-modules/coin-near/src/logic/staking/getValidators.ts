import type { Cursor, Page, Validator } from "@ledgerhq/coin-module-framework/api/index";
import { VALIDATORS_COUNT } from "../../constants";
import { getValidators as fetchValidators } from "../../network";

/**
 * Staking pools available for delegation. The indexer call is LRU-cached upstream and returns a
 * single capped page, so `next` is always undefined.
 */
export async function getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
  const validators = await fetchValidators({ total: VALIDATORS_COUNT });

  const items: Validator[] = validators.map(({ account_id, stake, commission }) => ({
    address: account_id,
    name: account_id,
    balance: BigInt(stake || "0"),
    commissionRate: String(commission),
  }));

  return { items, next: undefined };
}
