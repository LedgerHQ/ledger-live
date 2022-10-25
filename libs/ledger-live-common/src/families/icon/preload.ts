import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";

import type { IconPreloadData } from "./types";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: IconPreloadData = {
  somePreloadedData: {},
};

function fromHydratePreloadData(data: any): IconPreloadData {
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

const updates = new Subject<IconPreloadData>();

export function getCurrenticonPreloadData(): IconPreloadData {
  return currentPreloadedData;
}

export function seticonPreloadData(data: IconPreloadData) {
  if (data === currentPreloadedData) return;

  currentPreloadedData = data;

  updates.next(data);
}

export function geticonPreloadDataUpdates(): Observable<IconPreloadData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

export const preload = async (): Promise<IconPreloadData> => {
  log("icon/preload", "preloading Icon data...");

  const somePreloadedData = {};

  return { somePreloadedData };
};

export const hydrate = (data: any) => {
  const hydrated = fromHydratePreloadData(data);

  log("icon/preload", `hydrated foo with ${hydrated.somePreloadedData.foo}`);

  seticonPreloadData(hydrated);
};
