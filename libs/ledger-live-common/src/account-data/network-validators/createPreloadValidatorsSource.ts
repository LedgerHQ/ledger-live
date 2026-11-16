import type { NetworkValidatorsSource } from "@domain/api-network-validators";
import { currencyIdFromNetwork, type NetworkId } from "@domain/entity-account-descriptor";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { NetworkValidator } from "@domain/entity-network-validators";
import { getCurrentCosmosPreloadData } from "@ledgerhq/coin-cosmos/preloadedData";
import type { CosmosValidatorItem } from "../../families/cosmos/types";
import { isLedgerValidator } from "./isLedgerValidator";

export type PreloadValidatorsHost = {
  /** The app's currency bridge preload, the one FullSync runs before a sync. */
  prepareCurrency(currency: CryptoCurrency): Promise<unknown>;
};

const INTEGER = /^\d+$/;

export function fromCosmosValidator(
  { validatorAddress, name, commission, estimatedYearlyRewardsRate, tokens }: CosmosValidatorItem,
  isLedger = false,
): NetworkValidator {
  return {
    id: validatorAddress,
    address: validatorAddress,
    name,
    ...(commission >= 0 && commission <= 1 ? { commission } : {}),
    ...(estimatedYearlyRewardsRate >= 0 ? { apy: estimatedYearlyRewardsRate } : {}),
    ...(INTEGER.test(tokens) ? { totalStaked: tokens } : {}),
    ...(isLedger ? { isLedger: true } : {}),
  };
}

function currencyOf(networkId: NetworkId): CryptoCurrency | undefined {
  try {
    return findCryptoCurrencyById(currencyIdFromNetwork(networkId));
  } catch {
    return undefined;
  }
}

/** The validators the legacy currency bridge preloads, read once the app's `prepareCurrency` ran. Cosmos family only. */
export function createPreloadValidatorsSource(
  host: PreloadValidatorsHost,
): NetworkValidatorsSource {
  return {
    id: "preload",
    supports: networkId => currencyOf(networkId)?.family === "cosmos",
    async read(networkId) {
      const currency = currencyOf(networkId);
      if (!currency) throw new Error(`Unknown network ${networkId}`);
      let refreshError: unknown;
      try {
        await host.prepareCurrency(currency);
      } catch (error) {
        refreshError = error;
      }
      // A failed refresh falls back to the validators hydrated from the persisted cache.
      const validators = getCurrentCosmosPreloadData()[currency.id]?.validators ?? [];
      if (validators.length === 0) {
        if (refreshError instanceof Error) throw refreshError;
        throw new Error(`No preloaded validators for ${currency.id}`);
      }
      return validators.map(validator =>
        fromCosmosValidator(validator, isLedgerValidator(currency.id, validator.validatorAddress)),
      );
    },
  };
}
