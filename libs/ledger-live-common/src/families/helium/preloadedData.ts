import { Observable, Subject } from "rxjs";
import type { HeliumPreloadData } from "./types";

// this module holds the cached state of preload()
// eslint-disable-next-line no-unused-vars
let currentHeliumPreloadedData: HeliumPreloadData = {
  // NB initial state because UI need to work even if it's currently "loading", typically after clear cache
  validators: [],
  votes: [],
};

const updates = new Subject<HeliumPreloadData>();

export function setHeliumPreloadData(data: HeliumPreloadData): void {
  if (data === currentHeliumPreloadedData) return;
  currentHeliumPreloadedData = data;
  updates.next(data);
}

export function getCurrentHeliumPreloadData(): HeliumPreloadData {
  return currentHeliumPreloadedData;
}

export function getHeliumPreloadDataUpdates(): Observable<HeliumPreloadData> {
  return updates.asObservable();
}
