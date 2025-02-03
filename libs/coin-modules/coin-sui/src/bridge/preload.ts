import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";

import type { SuiPreloadData } from "../types";
import { getPreloadedData } from "../network";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: SuiPreloadData = {
  somePreloadedData: {},
};

function fromHydratePreloadData(data: any): SuiPreloadData {
  let foo = null;

  if (typeof data === "object" && data) {
    if (typeof data.somePreloadedData === "object" && data.somePreloadedData) {
      foo = data.somePreloadedData.foo || "bar";
    }
  }

  return {
    somePreloadedData: { foo },
  };
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
  log("sui/preload", "preloading sui data...");
  const preloadedData = await getPreloadedData();
  return { somePreloadedData: preloadedData };
};

export const hydrate = (data: any) => {
  const hydrated = fromHydratePreloadData(data);

  log("sui/preload", `hydrated foo with ${hydrated.somePreloadedData.foo}`);

  setSuiPreloadData(hydrated);
};
