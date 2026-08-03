import { Cursor, Page, Stake } from "@ledgerhq/coin-module-framework/api/index";
import { CosmosAPI } from "../../network/Cosmos";
import { buildStakes } from "./toStakes";

/**
 * Current staking positions as framework `Stake`s. Shares `buildStakes` with `getBalance`
 * so the CoinModuleApi and the account-shape staking views agree; Babylon pending-epoch
 * delegations are merged in by `getStakingPositions`.
 */
export async function getStakes(
  api: CosmosAPI,
  address: string,
  _cursor?: Cursor,
): Promise<Page<Stake>> {
  const currency = api.getCurrency();
  const positions = await api.getStakingPositions(address, currency);
  return { items: buildStakes(address, positions) };
}
