import { Observable, Subject } from "rxjs";
import type { CosmosPreloadData, CosmosValidatorItem } from "./types";

// this module holds the cached state of preload()
// eslint-disable-next-line no-unused-vars
const currentCosmosPreloadedData: { [currencyId: string]: CosmosPreloadData } =
  {};

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

const updates = new Subject<{ [currencyId: string]: CosmosPreloadData }>();

export function setCosmosPreloadData(
  currencyId: string,
  data: CosmosPreloadData
): void {
  currentCosmosPreloadedData[currencyId] = data;
  updates.next(currentCosmosPreloadedData);
}

export function getCurrentCosmosPreloadData(): {
  [currencyId: string]: CosmosPreloadData;
} {
  return currentCosmosPreloadedData;
}

export function getCosmosPreloadDataUpdates(): Observable<{
  [currencyId: string]: CosmosPreloadData;
}> {
  return updates.asObservable();
}
