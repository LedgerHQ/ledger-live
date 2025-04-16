import { BigNumber } from "bignumber.js";
import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";
import { PRELOAD_MAX_AGE } from "../logic";
import type { CeloPreloadData, CeloValidatorGroup } from "../types";
import { getValidatorGroups } from "../network/validators";

let currentCeloPreloadedData: CeloPreloadData = {
  validatorGroups: [],
};

function fromHydrateValidator(
  validatorGroupRaw: Record<string, string | number>,
): CeloValidatorGroup {
  return {
    address: validatorGroupRaw.address.toString(),
    name: validatorGroupRaw.name.toString(),
    votes: new BigNumber(validatorGroupRaw.votes),
  };
}

function fromHydratePreloadData(data: unknown): CeloPreloadData {
  let validatorGroups: CeloValidatorGroup[] = [];
  if (typeof data === "object" && data && "validatorGroups" in data) {
    if (Array.isArray(data.validatorGroups)) {
      validatorGroups = data.validatorGroups.map(fromHydrateValidator);
    }
  }

  return {
    validatorGroups,
  };
}

const updates = new Subject<CeloPreloadData>();
export function getCurrentCeloPreloadData(): CeloPreloadData {
  return currentCeloPreloadedData;
}
function setCeloPreloadData(data: CeloPreloadData) {
  if (data === currentCeloPreloadedData) return;
  currentCeloPreloadedData = data;
  updates.next(data);
}
export function getCeloPreloadDataUpdates(): Observable<CeloPreloadData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

export const preload = async (): Promise<CeloPreloadData> => {
  const { validatorGroups: previousValidatorGroups } = currentCeloPreloadedData;
  let validatorGroups = previousValidatorGroups;

  if (!validatorGroups || !validatorGroups.length) {
    log("celo/preload", "refreshing celo validatorGroups...");

    try {
      validatorGroups = await getValidatorGroups();
    } catch (error) {
      log("celo/preload", "failed to fetch validatorGroups", {
        error,
      });
    }
  }

  return { validatorGroups };
};

export const hydrate = (data: unknown) => {
  const hydrated = fromHydratePreloadData(data);
  log("celo/preload", "hydrate " + hydrated.validatorGroups.length + " celo validatorGroups");
  setCeloPreloadData(hydrated);
};
