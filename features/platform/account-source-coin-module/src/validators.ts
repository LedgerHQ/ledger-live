import type { NetworkValidatorsSource } from "@domain/api-network-validators";
import { currencyIdFromNetwork, type NetworkId } from "@domain/entity-account-descriptor";
import type { NetworkValidator } from "@domain/entity-network-validators";

/** One validator as a coin module lists it (`Validator` of the coin module framework). */
export type CoinModuleValidator = {
  id: string;
  address: string;
  name: string;
  url?: string;
  logo?: string;
  /** What is staked with it, in the smallest unit of the network's coin. */
  balance?: bigint;
  commissionRate?: string;
  apy?: number;
};

/** A falsy `next` ends the list. */
export type CoinModuleValidatorsPage = { items: CoinModuleValidator[]; next?: string };

export type CoinModuleValidatorsApi = {
  getValidators(cursor?: string): Promise<CoinModuleValidatorsPage>;
};

/** What the validators source takes from the coin modules, implemented by the app on top of its registry. */
export type CoinModuleValidatorsHost = {
  /** Synchronous: whether a coin module is registered for the currency, loaded or not. */
  isCurrencySupported(currencyId: string): boolean;
  /** The coin module of the currency, loaded on first use; `undefined` when it does not list validators. */
  getValidatorsApi(currencyId: string): Promise<CoinModuleValidatorsApi | undefined>;
};

export class CoinModuleValidatorsNotServedError extends Error {
  override name = "CoinModuleValidatorsNotServedError";
}

export const MAX_VALIDATOR_PAGES = 20;

const isHttpUrl = (value: string | undefined): value is string => {
  if (value === undefined) return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

/** Keeps only what the entity accepts: a field a module fills oddly is left out, not failing the list. */
export function toNetworkValidator({
  id,
  address,
  name,
  url,
  logo,
  balance,
  commissionRate,
  apy,
}: CoinModuleValidator): NetworkValidator {
  const commission = commissionRate === undefined ? Number.NaN : Number(commissionRate);
  return {
    id: id || address,
    name,
    ...(address ? { address } : {}),
    ...(commission >= 0 && commission <= 1 ? { commission } : {}),
    ...(apy !== undefined && apy >= 0 ? { apy } : {}),
    ...(balance !== undefined && balance >= 0n ? { totalStaked: balance.toString() } : {}),
    ...(isHttpUrl(logo) ? { iconUrl: logo } : {}),
    ...(isHttpUrl(url) ? { url } : {}),
  };
}

function currencyIdOf(networkId: NetworkId): string | undefined {
  try {
    return currencyIdFromNetwork(networkId);
  } catch {
    return undefined;
  }
}

/** Serves a network whose coin module lists its validators; the others fall through to the next source. */
export function createCoinModuleValidatorsSource(
  host: CoinModuleValidatorsHost,
): NetworkValidatorsSource {
  return {
    id: "coin-module",
    supports: networkId => {
      const currencyId = currencyIdOf(networkId);
      return currencyId !== undefined && host.isCurrencySupported(currencyId);
    },
    async read(networkId, { signal }) {
      const currencyId = currencyIdFromNetwork(networkId);
      const api = await host.getValidatorsApi(currencyId);
      if (!api) {
        throw new CoinModuleValidatorsNotServedError(
          `No validators in the ${currencyId} coin module`,
        );
      }
      const validators: NetworkValidator[] = [];
      let cursor: string | undefined;
      let complete = false;
      for (let page = 0; page < MAX_VALIDATOR_PAGES && !complete; page++) {
        signal.throwIfAborted();
        const { items, next } = await api.getValidators(cursor);
        validators.push(...items.map(toNetworkValidator));
        complete = !next || next === cursor;
        cursor = next;
      }
      // A truncated list would hide the validator a user delegates to: let the next source answer.
      if (!complete) {
        throw new CoinModuleValidatorsNotServedError(
          `More than ${MAX_VALIDATOR_PAGES} pages of validators for ${currencyId}`,
        );
      }
      // No network has no validator: an empty list falls through to the next source.
      if (validators.length === 0) {
        throw new CoinModuleValidatorsNotServedError(`No validators listed for ${currencyId}`);
      }
      return validators;
    },
  };
}
