import type { NetworkValidatorsSource } from "@domain/api-network-validators";
import { currencyIdFromNetwork, type NetworkId } from "@domain/entity-account-descriptor";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { NetworkValidator } from "@domain/entity-network-validators";
import { getCurrentCosmosPreloadData } from "@ledgerhq/coin-cosmos/preloadedData";
import type { CosmosValidatorItem } from "../families/cosmos/types";

export type PreloadValidatorsHost = {
  /** The app's currency bridge preload, the one FullSync runs before a sync. */
  prepareCurrency(currency: CryptoCurrency): Promise<unknown>;
};

const INTEGER = /^\d+$/;

export function fromCosmosValidator({
  validatorAddress,
  name,
  commission,
  estimatedYearlyRewardsRate,
  tokens,
}: CosmosValidatorItem): NetworkValidator {
  return {
    id: validatorAddress,
    address: validatorAddress,
    name,
    ...(commission >= 0 && commission <= 1 ? { commission } : {}),
    ...(estimatedYearlyRewardsRate >= 0 ? { apy: estimatedYearlyRewardsRate } : {}),
    ...(INTEGER.test(tokens) ? { totalStaked: tokens } : {}),
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
      await host.prepareCurrency(currency);
      const validators = getCurrentCosmosPreloadData()[currency.id]?.validators ?? [];
      // An empty preload is a failed one: no network has no validator.
      if (validators.length === 0) throw new Error(`No preloaded validators for ${currency.id}`);
      return validators.map(fromCosmosValidator);
    },
  };
}
