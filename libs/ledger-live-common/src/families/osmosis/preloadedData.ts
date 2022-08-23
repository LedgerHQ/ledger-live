import { Observable, Subject } from "rxjs";
import type { CosmosPreloadData, CosmosValidatorItem } from "../cosmos/types";
import { asSafeCosmosPreloadData } from "../cosmos/preloadedData";

// this module holds the cached state of preload()
// eslint-disable-next-line no-unused-vars
let currentOsmosisPreloadedData: CosmosPreloadData = {
  // NB initial state because UI need to work even if it's currently "loading", typically after clear cache
  validators: [],
};

const updates = new Subject<CosmosPreloadData>();

export function setOsmosisPreloadData(data: CosmosPreloadData): void {
  if (data === currentOsmosisPreloadedData) return;
  currentOsmosisPreloadedData = data;
  updates.next(data);
}

export function getCurrentOsmosisPreloadData(): CosmosPreloadData {
  return currentOsmosisPreloadedData;
}

export function getOsmosisPreloadDataUpdates(): Observable<CosmosPreloadData> {
  return updates.asObservable();
}

export function asSafeOsmosisPreloadData(data?: {
  validators?: CosmosValidatorItem[];
}): CosmosPreloadData {
  return asSafeCosmosPreloadData(data);
}
