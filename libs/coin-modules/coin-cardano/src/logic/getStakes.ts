import type { Cursor, Page, Stake } from "@ledgerhq/coin-module-framework/api/index";
import { buildStake, fetchDelegation } from "./stake";
import type { CardanoCoinConfig } from "../config";

/**
 * Staking positions of a Cardano address. A delegation is account-level, keyed by the
 * single stake credential in the address, so there is at most one position and no
 * pagination. Returns an empty page when the address has no stake credential or no
 * staking position to report.
 */
export async function getStakes(
  config: CardanoCoinConfig,
  address: string,
  _cursor?: Cursor,
): Promise<Page<Stake>> {
  const { stakeKey, delegation } = await fetchDelegation(config, address);
  const stake = buildStake(address, stakeKey, delegation);
  return { items: stake ? [stake] : [] };
}
