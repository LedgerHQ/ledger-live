import { fetchPoolDetails as fetchPoolDetailsByConfig } from "@ledgerhq/coin-cardano/api/getPools";
import type { APIGetPoolsDetail } from "@ledgerhq/coin-cardano/api/api-types";
import { cardanoDefaults, type CardanoCoinConfig } from "@ledgerhq/coin-cardano/config";
import { CardanoInvalidConfigError } from "@ledgerhq/coin-cardano/errors";
import {
  getLedgerValidators,
  getValidatorsBatchSize,
  LEDGER_VALIDATORS,
} from "@ledgerhq/coin-cardano/tuning";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { log } from "@ledgerhq/logs";
import { getCurrencyConfiguration } from "../../config";

export type { APIGetPoolsDetail, StakePool } from "@ledgerhq/coin-cardano/api/api-types";

export function fetchPoolDetails(
  currency: CryptoCurrency,
  poolIds: Array<string>,
): Promise<APIGetPoolsDetail> {
  return fetchPoolDetailsByConfig(
    getCurrencyConfiguration<CardanoCoinConfig>(currency.id),
    poolIds,
  );
}

/**
 * Reads a tuning value for a React render. An invalid config is logged and answers `fallback`
 * rather than breaking the delegation screens.
 */
function readForRender<T>(
  currency: CryptoCurrency,
  read: (config: CardanoCoinConfig) => T,
  fallback: T,
): T {
  try {
    return read(getCurrencyConfiguration<CardanoCoinConfig>(currency.id));
  } catch (error) {
    if (!(error instanceof CardanoInvalidConfigError)) throw error;
    log("cardano", error.message);
    return fallback;
  }
}

/** The pool ids shown as Ledger pools, from the currency's coin config. */
export const getLedgerPoolIds = (currency: CryptoCurrency): readonly string[] =>
  readForRender(currency, getLedgerValidators, LEDGER_VALIDATORS);

/** Pools per pool-list request, from the currency's coin config. */
export const getPoolPageSize = (currency: CryptoCurrency): number =>
  readForRender(currency, getValidatorsBatchSize, cardanoDefaults.cardano.validators.batchSize);
