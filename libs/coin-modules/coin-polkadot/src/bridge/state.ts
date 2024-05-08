/**
 * Data keeping track of current "states" of the module.
 */

import { Observable, Subject } from "rxjs";
import { PolkadotPreloadData } from "../types";

let currentPolkadotPreloadedData: PolkadotPreloadData = {
  validators: [],
  staking: undefined,
  minimumBondBalance: "0",
};

const updates = new Subject<PolkadotPreloadData>();

export function getCurrentPolkadotPreloadData(): PolkadotPreloadData {
  return currentPolkadotPreloadedData;
}

export function setPolkadotPreloadData(data: PolkadotPreloadData) {
  if (data === currentPolkadotPreloadedData) return;
  currentPolkadotPreloadedData = data;
  updates.next(data);
}

export function getPolkadotPreloadDataUpdates(): Observable<PolkadotPreloadData> {
  return updates.asObservable();
}
