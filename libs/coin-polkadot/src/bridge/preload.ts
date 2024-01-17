/* eslint-disable no-prototype-builtins */
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { PolkadotPreloadData, PolkadotStakingProgress, PolkadotValidator } from "../types";
import { PolkadotAPI } from "../network";
import { loadPolkadotCrypto } from "../logic/polkadot-crypto";
import { getCurrentPolkadotPreloadData, setPolkadotPreloadData } from "../logic/state";

const PRELOAD_MAX_AGE = 60 * 1000;

function fromHydrateValidator(validatorRaw: Record<string, any>): PolkadotValidator {
  return {
    address: validatorRaw.address,
    identity: validatorRaw.identity,
    nominatorsCount: Number(validatorRaw.nominatorsCount),
    rewardPoints:
      validatorRaw.rewardPoints === null ? null : new BigNumber(validatorRaw.rewardPoints),
    commission: new BigNumber(validatorRaw.commission),
    totalBonded: new BigNumber(validatorRaw.totalBonded),
    selfBonded: new BigNumber(validatorRaw.selfBonded),
    isElected: !!validatorRaw.isElected,
    isOversubscribed: !!validatorRaw.isOversubscribed,
  };
}

function fromHydratePreloadData(data: any): PolkadotPreloadData {
  let validators = [];
  let staking:
    | {
        electionClosed: boolean;
        activeEra: number;
        maxNominatorRewardedPerValidator: number;
        bondingDuration: number;
      }
    | undefined = undefined;
  let minimumBondBalance = "0";

  if (typeof data === "object" && data) {
    if (Array.isArray(data.validators)) {
      validators = data.validators.map(fromHydrateValidator);
    }

    if (data.staking !== null && typeof data.staking === "object") {
      const { electionClosed, activeEra, maxNominatorRewardedPerValidator, bondingDuration } =
        data.staking;
      staking = {
        electionClosed: !!electionClosed,
        activeEra: Number(activeEra),
        maxNominatorRewardedPerValidator: Number(maxNominatorRewardedPerValidator) || 128,
        bondingDuration: Number(bondingDuration) || 28,
      };
    }

    if (data.minimumBondBalance !== null && typeof data.minimumBondBalance === "string") {
      minimumBondBalance = data.minimumBondBalance || "0";
    }
  }

  return {
    validators,
    staking,
    minimumBondBalance,
  };
}

/**
 * load max cache time for the validators
 */
export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

const shouldRefreshValidators = (
  previousState: PolkadotStakingProgress | undefined,
  currentState: PolkadotStakingProgress,
) => {
  return !previousState || currentState.activeEra !== previousState.activeEra;
};

export const preload = (polkadotAPI: PolkadotAPI) => async (): Promise<PolkadotPreloadData> => {
  await loadPolkadotCrypto();
  await polkadotAPI.getRegistry(); // ensure registry is already in cache.
  const minimumBondBalance = await polkadotAPI.getMinimumBondBalance().toString();

  const currentStakingProgress = await polkadotAPI.getStakingProgress();
  const { validators: previousValidators, staking: previousStakingProgress } =
    getCurrentPolkadotPreloadData();
  let validators = previousValidators;

  if (
    !validators ||
    !validators.length ||
    shouldRefreshValidators(previousStakingProgress, currentStakingProgress)
  ) {
    log("polkadot/preload", "refreshing polkadot validators...");

    try {
      validators = await polkadotAPI.getValidators("all");
    } catch (error) {
      log("polkadot/preload", "failed to fetch validators", {
        error,
      });
    }
  }

  return {
    validators,
    staking: currentStakingProgress,
    minimumBondBalance,
  };
};

export const hydrate = (data: unknown) => {
  const hydrated = fromHydratePreloadData(data);
  log("polkadot/preload", "hydrate " + hydrated.validators.length + " polkadot validators");
  setPolkadotPreloadData(hydrated);
};
