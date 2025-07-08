import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodes } from "./api/mirror";
import { extractCompanyFromNodeDescription } from "./logic";
import { setHederaPreloadData } from "./preload-data";
import { HederaPreloadData, HederaValidator } from "./types";

export const getPreloadStrategy = () => ({
  preloadMaxAge: 15 * 60 * 1000, // 15 minutes
});

export async function preload(currency: CryptoCurrency): Promise<HederaPreloadData> {
  log("hedera/preload", "preloading hedera data...");
  const nodes = await getNodes();

  const validators: HederaValidator[] = nodes.map(mirrorNode => {
    const minStake = new BigNumber(mirrorNode.min_stake);
    const maxStake = new BigNumber(mirrorNode.max_stake);
    const activeStake = new BigNumber(mirrorNode.stake);
    const activeStakePercentage = maxStake.gt(0)
      ? activeStake.dividedBy(maxStake).multipliedBy(100).dp(0, BigNumber.ROUND_DOWN)
      : new BigNumber(0);

    return {
      nodeId: mirrorNode.node_id,
      address: mirrorNode.node_account_id,
      name: extractCompanyFromNodeDescription(mirrorNode.description),
      minStake,
      maxStake,
      activeStake,
      activeStakePercentage,
      overstaked: activeStake.gte(maxStake),
    };
  });

  const data: HederaPreloadData = {
    validators,
  };

  setHederaPreloadData(data, currency);

  return data;
}

function mapRawValidatorToValidator(validatorRaw: Record<string, any>): HederaValidator {
  return {
    nodeId: validatorRaw.nodeId,
    address: validatorRaw.address,
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
      validators = data.validators.map(mapRawValidatorToValidator);
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
