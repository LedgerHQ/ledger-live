import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import {
  extractCompanyFromNodeDescription,
  getChecksum,
  resolveConfig,
  sortValidators,
} from "./logic/utils";
import { apiClient } from "./network/api";
import { setHederaPreloadData } from "./preload-data";
import type { HederaPreloadData, HederaValidator, HederaValidatorRaw } from "./types";

export const getPreloadStrategy = () => ({
  preloadMaxAge: 15 * 60 * 1000, // 15 minutes
});

export async function preload(currency: CryptoCurrency): Promise<HederaPreloadData> {
  log("hedera/preload", "preloading hedera data...");
  const result = await apiClient.getNodes({ configOrCurrencyId: currency.id, fetchAllPages: true });
  const config = resolveConfig(currency.id);
  const ledgerNodeId = String(config.ledgerNodeId);

  const validators: HederaValidator[] = result.nodes.map(mirrorNode => {
    const id = mirrorNode.node_id.toString();
    const minStake = new BigNumber(mirrorNode.min_stake);
    const maxStake = new BigNumber(mirrorNode.max_stake);
    const activeStake = new BigNumber(mirrorNode.stake_rewarded);
    const activeStakePercentage = maxStake.gt(0)
      ? activeStake.dividedBy(maxStake).multipliedBy(100).dp(0, BigNumber.ROUND_CEIL)
      : new BigNumber(0);

    return {
      id,
      address: mirrorNode.node_account_id,
      addressChecksum: getChecksum(mirrorNode.node_account_id),
      name: extractCompanyFromNodeDescription(mirrorNode.description),
      minStake,
      maxStake,
      activeStake,
      activeStakePercentage,
      overstaked: activeStake.gte(maxStake),
      isLedgerNode: id === ledgerNodeId,
    };
  });

  const sortedValidators = sortValidators(validators);
  const data: HederaPreloadData = {
    validators: sortedValidators,
  };

  setHederaPreloadData(data, currency);

  return data;
}

// caches written before `nodeId` was renamed to `id` still hold `nodeId: number`
type HederaValidatorRawLegacy = Omit<HederaValidatorRaw, "id"> & { id?: string; nodeId?: number };

function mapRawValidatorToValidator(
  validatorRaw: HederaValidatorRawLegacy,
  ledgerNodeId: string,
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
    isLedgerNode: id === ledgerNodeId,
  };
}

function fromHydratePreloadData(data: unknown, ledgerNodeId: string): HederaPreloadData {
  let validators: HederaValidator[] = [];

  if (data && typeof data === "object" && "validators" in data) {
    if (Array.isArray(data.validators)) {
      validators = data.validators
        .map(validatorRaw => mapRawValidatorToValidator(validatorRaw, ledgerNodeId))
        .filter((validator): validator is HederaValidator => validator !== null);
    }
  }

  return {
    validators,
  };
}

export function hydrate(data: unknown, currency: CryptoCurrency): void {
  const config = resolveConfig(currency.id);
  const ledgerNodeId = String(config.ledgerNodeId);
  const hydrated = fromHydratePreloadData(data, ledgerNodeId);
  log("hedera/preload", `hydrated ${hydrated.validators.length} hedera validators`);
  setHederaPreloadData(hydrated, currency);
}
