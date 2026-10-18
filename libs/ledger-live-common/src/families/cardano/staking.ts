import { fetchPoolDetails as fetchPoolDetailsByConfig } from "@ledgerhq/coin-cardano/api/getPools";
import type { APIGetPoolsDetail } from "@ledgerhq/coin-cardano/api/api-types";
import type { CardanoCoinConfig } from "@ledgerhq/coin-cardano/config";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getCurrencyConfiguration } from "../../config";

export type { APIGetPoolsDetail, StakePool } from "@ledgerhq/coin-cardano/api/api-types";
export { DEFAULT_SELECTED_POOL_ID, LEDGER_POOL_IDS } from "@ledgerhq/coin-cardano/pools";

export function fetchPoolDetails(
  currency: CryptoCurrency,
  poolIds: Array<string>,
): Promise<APIGetPoolsDetail> {
  return fetchPoolDetailsByConfig(
    getCurrencyConfiguration<CardanoCoinConfig>(currency.id),
    poolIds,
  );
}
