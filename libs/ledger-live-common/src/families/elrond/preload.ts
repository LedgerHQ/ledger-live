import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { ElrondPreloadData } from "./types";
import { getValidators } from "./api";
const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: ElrondPreloadData = {
  validators: {},
};

function fromHydratePreloadData(data: any): ElrondPreloadData {
  let foo = null;

  if (typeof data === "object" && data) {
    if (typeof data.validators === "object" && data.validators) {
      foo = data.validators.foo || "bar";
    }
  }

  return {
    validators: {
      foo,
    },
  };
}

const updates = new Subject<ElrondPreloadData>();
export function getCurrentElrondPreloadData(): ElrondPreloadData {
  return currentPreloadedData;
}
export function setElrondPreloadData(data: ElrondPreloadData) {
  if (data === currentPreloadedData) return;
  currentPreloadedData = data;
  updates.next(data);
}
export function getElrondPreloadDataUpdates(): Observable<ElrondPreloadData> {
  return updates.asObservable();
}
export const getPreloadStrategy = () => {
  return {
    preloadMaxAge: PRELOAD_MAX_AGE,
  };
};
export const preload = async (): Promise<ElrondPreloadData> => {
  log("elrond/preload", "preloading elrond data...");
  const validators = (await getValidators()) || [];
  return {
    validators,
  };
};
export const hydrate = (data: unknown) => {
  const hydrated = fromHydratePreloadData(data);
  log("elrond/preload", `hydrated foo with ${hydrated.validators.foo}`);
  setElrondPreloadData(hydrated);
};
