import { Observable, Subject } from "rxjs";
import type { SuiPreloadData } from "../types";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: SuiPreloadData = { validators: [], tokens: [] };

const updates = new Subject<SuiPreloadData>();

export function getCurrentSuiPreloadData(): SuiPreloadData {
  return currentPreloadedData;
}

export function setSuiPreloadData(data: SuiPreloadData) {
  if (data === currentPreloadedData) return;

  currentPreloadedData = data;

  updates.next(data);
}

export function getSuiPreloadDataUpdates(): Observable<SuiPreloadData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

export const preload = async (): Promise<SuiPreloadData> => {
  return { validators: [], tokens: [] };
};

export const hydrate = (_data: SuiPreloadData) => {
  // noop
};
