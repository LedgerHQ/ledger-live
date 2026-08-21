import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import { mapMirrorNodesToValidators } from "./logic/utils";
import { apiClient } from "./network/api";
import { setHederaPreloadData } from "./preload-data";
import type { HederaPreloadData, HederaValidator, HederaValidatorRaw } from "./types";

export const getPreloadStrategy = () => ({
  preloadMaxAge: 15 * 60 * 1000, // 15 minutes
});

export async function preload(currency: CryptoCurrency): Promise<HederaPreloadData> {
  log("hedera/preload", "preloading hedera data...");
  const result = await apiClient.getNodes({ configOrCurrencyId: currency.id, fetchAllPages: true });

  const data: HederaPreloadData = {
    validators: mapMirrorNodesToValidators(result.nodes),
  };

  setHederaPreloadData(data, currency);

  return data;
}

// caches written before `nodeId` was renamed to `id` still hold `nodeId: number`
type HederaValidatorRawLegacy = Omit<HederaValidatorRaw, "id"> & { id?: string; nodeId?: number };

function mapRawValidatorToValidator(
  validatorRaw: HederaValidatorRawLegacy,
): HederaValidator | null {
  const id = validatorRaw.id ?? validatorRaw.nodeId?.toString();

  if (id === undefined) {
    return null;
  }

  return {
    id,
    address: validatorRaw.address,
    addressChecksum: validatorRaw.addressChecksum,
    name: validatorRaw.name,
    minStake: new BigNumber(validatorRaw.minStake),
    maxStake: new BigNumber(validatorRaw.maxStake),
    activeStake: new BigNumber(validatorRaw.activeStake),
    activeStakePercentage: new BigNumber(validatorRaw.activeStakePercentage),
    overstaked: validatorRaw.overstaked,
  };
}

function fromHydratePreloadData(data: unknown): HederaPreloadData {
  let validators: HederaValidator[] = [];

  if (data && typeof data === "object" && "validators" in data) {
    if (Array.isArray(data.validators)) {
      validators = data.validators
        .map(mapRawValidatorToValidator)
        .filter((validator): validator is HederaValidator => validator !== null);
    }
  }

  return {
    validators,
  };
}

export function hydrate(data: unknown, currency: CryptoCurrency): void {
  const hydrated = fromHydratePreloadData(data);
  log("hedera/preload", `hydrated ${hydrated.validators.length} hedera validators`);
  setHederaPreloadData(hydrated, currency);
}
