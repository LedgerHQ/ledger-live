import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";

import type { SuiPreloadData } from "../types";
import { getValidators } from "../network/sdk";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: SuiPreloadData = { validators: [] };

function fromHydratePreloadData(_data: SuiPreloadData): SuiPreloadData {
  return { validators: _data.validators };
}

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
  const validators = await getValidators();
  log("sui/preload", "preloading sui data...");

  return { validators };
};

export const hydrate = (data: SuiPreloadData) => {
  const hydrated = fromHydratePreloadData(data);

  setSuiPreloadData(hydrated);
};
