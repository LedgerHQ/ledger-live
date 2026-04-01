import { BigNumber } from "bignumber.js";
import { Subject } from "rxjs";
import { FALLBACK_STORAGE_AMOUNT_PER_BYTE } from "./constants";
import type { NearPreloadedData } from "./types";

let currentPreloadedData: NearPreloadedData = {
  storageCost: new BigNumber(FALLBACK_STORAGE_AMOUNT_PER_BYTE),
  gasPrice: new BigNumber(0),
  createAccountCostSend: new BigNumber(0),
  createAccountCostExecution: new BigNumber(0),
  transferCostSend: new BigNumber(0),
  transferCostExecution: new BigNumber(0),
  addKeyCostSend: new BigNumber(0),
  addKeyCostExecution: new BigNumber(0),
  receiptCreationSend: new BigNumber(0),
  receiptCreationExecution: new BigNumber(0),
  validators: [],
};

const updates = new Subject<NearPreloadedData>();

export function getCurrentNearPreloadData(): NearPreloadedData {
  return currentPreloadedData;
}

export function setNearPreloadData(data: NearPreloadedData): void {
  if (data === currentPreloadedData) return;

  currentPreloadedData = data;

  updates.next(data);
}
