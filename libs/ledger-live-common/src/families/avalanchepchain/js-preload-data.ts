import { Observable, Subject } from "rxjs";
import type {
  AvalanchePChainPreloadData,
  AvalanchePChainValidator,
} from "./types";
import { log } from "@ledgerhq/logs";
import { getValidators, customValidatorFilter } from "./api/sdk";
import BigNumber from "bignumber.js";

const TEN_MINUTES = 60 * 10000;

let currentData: AvalanchePChainPreloadData = {
  validators: [],
};

const updates = new Subject<AvalanchePChainPreloadData>();

export function setAvalanchePChainPreloadData(
  data: AvalanchePChainPreloadData
): void {
  if (data === currentData) return;
  currentData = data;
  updates.next(data);
}

export function getCurrentAvalanchePChainPreloadData(): AvalanchePChainPreloadData {
  return currentData;
}

export function getAvalanchePChainPreloadDataUpdates(): Observable<AvalanchePChainPreloadData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: TEN_MINUTES,
});

export const preload = async (): Promise<AvalanchePChainPreloadData> => {
  const { validators: previousValidators } = currentData;
  let validators = previousValidators;

  if (!validators || !validators.length) {
    log("avalanche/preload", "refreshing avalanche validators...");

    try {
      validators = await getValidators();
      validators = await customValidatorFilter(validators);
    } catch (error) {
      log("avalanche/preload", "failed to fetch validators", {
        error,
      });
    }
  }

  return { validators };
};

export const hydrate = (data: unknown) => {
  const hydrated = fromHydratePreloadData(data);
  log(
    "avalanche/preload",
    `hydrate ${hydrated.validators.length} avalanche validators`
  );
  setAvalanchePChainPreloadData(hydrated);
};

function fromHydratePreloadData(data: any): AvalanchePChainPreloadData {
  let validators = [];

  if (typeof data === "object" && data) {
    if (Array.isArray(data.validators)) {
      validators = data.validators.map(fromHydrateValidator);
    }
  }

  return {
    validators,
  };
}

function fromHydrateValidator(
  validatorRaw: Record<string, any>
): AvalanchePChainValidator {
  return {
    txID: validatorRaw.txID,
    startTime: validatorRaw.startTime,
    endTime: validatorRaw.endTime,
    stakeAmount: new BigNumber(validatorRaw.stakeAmount),
    nodeID: validatorRaw.nodeID,
    rewardOwner: validatorRaw.rewardOwner,
    potentialReward: new BigNumber(validatorRaw.potentialReward),
    delegationFee: new BigNumber(validatorRaw.delegationFee),
    uptime: new BigNumber(validatorRaw.uptime),
    connected: validatorRaw.connected,
    delegators: validatorRaw.delegators,
    remainingStake: new BigNumber(validatorRaw.remainingStake),
  };
}
