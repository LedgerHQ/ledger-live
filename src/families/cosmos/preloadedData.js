// @flow
import { Observable, Subject } from "rxjs";
import type { CosmosPreloadData } from "./types";

// this module holds the cached state of preload()

// eslint-disable-next-line no-unused-vars
let currentCosmosPreloadedData: CosmosPreloadData = {
  // NB initial state because UI need to work even if it's currently "loading", typically after clear cache
  validators: [],
  rewardsState: {
    targetBondedRatio: 0,
    communityPoolCommission: 0,
    assumedTimePerBlock: 0,
    inflationRateChange: 0,
    inflationMaxRate: 0,
    inflationMinRate: 0,
    actualBondedRatio: 0,
    averageTimePerBlock: 0,
    totalSupply: 0,
    averageDailyFees: 0,
    currentValueInflation: 0,
  },
};

export function asSafeCosmosPreloadData(data: mixed): CosmosPreloadData {
  // NB this function must not break and be resilient to changes in data
  const validators = [];
  if (typeof data === "object" && data) {
    const validatorsUnsafe = data.validatorsUnsafe;
    if (
      typeof validatorsUnsafe === "object" &&
      validatorsUnsafe &&
      Array.isArray(validatorsUnsafe)
    ) {
      validatorsUnsafe.forEach((v) => {
        // FIXME if model changes, we should validate the object
        validators.push(v);
      });
    }
  }

  // $FlowFixMe TODO more validation
  const rewardsState = data.rewardsState;
  return {
    validators,
    rewardsState,
  };
}

const updates = new Subject<CosmosPreloadData>();

export function setCosmosPreloadData(data: CosmosPreloadData) {
  if (data === currentCosmosPreloadedData) return;
  currentCosmosPreloadedData = data;
  updates.next(data);
}

export function getCurrentCosmosPreloadData(): CosmosPreloadData {
  return currentCosmosPreloadedData;
}

export function getCosmosPreloadDataUpdates(): Observable<CosmosPreloadData> {
  return updates.asObservable();
}
