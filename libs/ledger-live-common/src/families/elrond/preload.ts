import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { ElrondPreloadData, ElrondProvider } from "./types";
import { getProviders } from "./api";
const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

let currentPreloadedData: ElrondPreloadData = {
  validators: [],
};

function fromHydrateValidator(validatorRaw: Record<string, any>): ElrondProvider {
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

function fromHydratePreloadData(data: any): ElrondPreloadData {
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
  const validators = (await getProviders()) || [];
  return {
    validators,
  };
};
export const hydrate = (data: unknown) => {
  const hydrated = fromHydratePreloadData(data);
  log("elrond/preload", `hydrated ${hydrated.validators.length} elrond validators`);
  setElrondPreloadData(hydrated);
};
