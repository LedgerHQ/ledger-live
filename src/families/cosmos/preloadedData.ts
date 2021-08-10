import { Observable, Subject } from "rxjs";
import type { CosmosPreloadData, CosmosValidatorItem } from "./types";

// this module holds the cached state of preload()
// eslint-disable-next-line no-unused-vars
let currentCosmosPreloadedData: CosmosPreloadData = {
  // NB initial state because UI need to work even if it's currently "loading", typically after clear cache
  validators: [],
};
export function asSafeCosmosPreloadData(data?: {
  validators?: CosmosValidatorItem[];
}): CosmosPreloadData {
  // NB this function must not break and be resilient to changes in data
  const validators: CosmosValidatorItem[] = [];

  if (typeof data === "object" && data) {
    const validatorsUnsafe = data.validators;

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

  return {
    validators,
  };
}

const updates = new Subject<CosmosPreloadData>();

export function setCosmosPreloadData(data: CosmosPreloadData): void {
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
