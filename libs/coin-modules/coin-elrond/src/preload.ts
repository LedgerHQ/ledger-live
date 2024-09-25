import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { MultiversxPreloadData, MultiversxProvider } from "./types";
import { getProviders } from "./api";
const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: MultiversxPreloadData = {
  validators: [],
};

function fromHydrateValidator(validatorRaw: Record<string, any>): MultiversxProvider {
  return {
    contract: validatorRaw.contract,
    owner: validatorRaw.owner,
    serviceFee: validatorRaw.serviceFee,
    maxDelegationCap: validatorRaw.maxDelegationCap,
    initialOwnerFunds: validatorRaw.initialOwnerFunds,
    totalActiveStake: validatorRaw.totalActiveStake,
    totalUnstaked: validatorRaw.totalUnstaked,
    maxDelegateAmountAllowed: validatorRaw.maxDelegateAmountAllowed,
    apr: validatorRaw.apr,
    explorerURL: validatorRaw.explorerURL,
    address: validatorRaw.address,
    aprValue: Number(validatorRaw.aprValue),
    automaticActivation: !!validatorRaw.automaticActivation,
    changeableServiceFee: !!validatorRaw.changeableServiceFee,
    checkCapOnRedelegate: !!validatorRaw.checkCapOnRedelegate,
    createdNonce: Number(validatorRaw.createdNonce),
    featured: !!validatorRaw.featured,
    numNodes: Number(validatorRaw.numNodes),
    numUsers: Number(validatorRaw.numUsers),
    ownerBelowRequiredBalanceThreshold: !!validatorRaw.ownerBelowRequiredBalanceThreshold,
    unBondPeriod: Number(validatorRaw.unBondPeriod),
    withDelegationCap: !!validatorRaw.withDelegationCap,
    disabled: !!validatorRaw.disabled,
    identity: {
      key: validatorRaw.identity.key,
      name: validatorRaw.identity.name,
      avatar: validatorRaw.identity.avatar,
      description: validatorRaw.identity.description,
      location: validatorRaw.identity.location === null ? null : validatorRaw.location,
      twitter: validatorRaw.identity.twitter,
      url: validatorRaw.identity.url,
    },
  };
}

function fromHydratePreloadData(data: any): MultiversxPreloadData {
  let validators = [];

  if (typeof data === "object" && data) {
    if (Array.isArray(data.validators)) {
      validators = data.validators.map(fromHydrateValidator);
    }
  }

  return {
    validators,
  };
}

const updates = new Subject<MultiversxPreloadData>();
export function getCurrentMultiversxPreloadData(): MultiversxPreloadData {
  return currentPreloadedData;
}

export function setMultiversxPreloadData(data: MultiversxPreloadData) {
  if (data === currentPreloadedData) return;
  currentPreloadedData = data;
  updates.next(data);
}

export function getMultiversxPreloadDataUpdates(): Observable<MultiversxPreloadData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => {
  return {
    preloadMaxAge: PRELOAD_MAX_AGE,
  };
};

export const preload = async (): Promise<MultiversxPreloadData> => {
  log("multiversx/preload", "preloading multiversx data...");
  const validators = (await getProviders()) || [];
  return {
    validators,
  };
};

export const hydrate = (data: unknown) => {
  const hydrated = fromHydratePreloadData(data);
  log("multiversx/preload", `hydrated ${hydrated.validators.length} multiversx validators`);
  setMultiversxPreloadData(hydrated);
};
