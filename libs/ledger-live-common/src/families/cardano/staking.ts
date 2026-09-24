import type { CardanoCoinConfig } from "@ledgerhq/coin-cardano/config";
import { fetchPoolDetails as fetchPoolDetailsFromConfig } from "@ledgerhq/coin-cardano/api/getPools";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getCurrencyConfiguration } from "../../config";

export type { APIGetPoolsDetail, StakePool } from "@ledgerhq/coin-cardano/api/api-types";
export { DEFAULT_SELECTED_POOL_ID, LEDGER_POOL_IDS } from "@ledgerhq/coin-cardano/pools";

export const fetchPoolDetails = (currency: CryptoCurrency, poolIds: Array<string>) =>
  fetchPoolDetailsFromConfig(getCurrencyConfiguration<CardanoCoinConfig>(currency.id), poolIds);
