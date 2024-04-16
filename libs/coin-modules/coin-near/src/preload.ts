import { BigNumber } from "bignumber.js";
import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { NearPreloadedData } from "./types";
import { getProtocolConfig, getValidators, getCommission, getGasPrice } from "./api";
import { FALLBACK_STORAGE_AMOUNT_PER_BYTE } from "./constants";
import { NearProtocolConfigNotLoaded } from "./errors";

const PRELOAD_MAX_AGE = 30 * 60 * 1000;

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

function fromHydratePreloadData(data: any): NearPreloadedData {
  const hydratedData = Object.assign({}, currentPreloadedData);

  if (typeof data === "object" && data) {
    if (data.storageCost) {
      hydratedData.storageCost = new BigNumber(data.storageCost);
    }
    if (data.gasPrice) {
      hydratedData.gasPrice = new BigNumber(data.gasPrice);
    }
    if (data.createAccountCostSend) {
      hydratedData.createAccountCostSend = new BigNumber(data.createAccountCostSend);
    }
    if (data.createAccountCostExecution) {
      hydratedData.createAccountCostExecution = new BigNumber(data.createAccountCostExecution);
    }
    if (data.transferCostSend) {
      hydratedData.transferCostSend = new BigNumber(data.transferCostSend);
    }
    if (data.transferCostExecution) {
      hydratedData.transferCostExecution = new BigNumber(data.transferCostExecution);
    }
    if (data.addKeyCostSend) {
      hydratedData.addKeyCostSend = new BigNumber(data.addKeyCostSend);
    }
    if (data.addKeyCostExecution) {
      hydratedData.addKeyCostExecution = new BigNumber(data.addKeyCostExecution);
    }
    if (data.receiptCreationSend) {
      hydratedData.receiptCreationSend = new BigNumber(data.receiptCreationSend);
    }
    if (data.receiptCreationExecution) {
      hydratedData.receiptCreationExecution = new BigNumber(data.receiptCreationExecution);
    }
    if (Array.isArray(data.validators) && data.validators.length) {
      hydratedData.validators = data.validators;
    }
  }

  return hydratedData;
}

const updates = new Subject<NearPreloadedData>();

export function getCurrentNearPreloadData(): NearPreloadedData {
  return currentPreloadedData;
}

export function setNearPreloadData(data: NearPreloadedData): void {
  if (data === currentPreloadedData) return;

  currentPreloadedData = data;

  updates.next(data);
}

export function getNearPreloadDataUpdates(): Observable<NearPreloadedData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

export const preload = async (): Promise<NearPreloadedData> => {
  log("near/preload", "preloading near data...");

  const [protocolConfig, rawValidators, gasPrice] = await Promise.all([
    getProtocolConfig(),
    getValidators(),
    getGasPrice(),
  ]);

  const validators = await Promise.all(
    rawValidators.map(async ({ account_id, stake }) => {
      const commission = await getCommission(account_id);

      return {
        validatorAddress: account_id,
        tokens: stake,
        commission,
      };
    }),
  );

  if (!protocolConfig) {
    throw new NearProtocolConfigNotLoaded();
  }

  const { storage_amount_per_byte, transaction_costs } = protocolConfig.runtime_config;

  const { action_creation_config, action_receipt_creation_config } = transaction_costs;

  return {
    storageCost: new BigNumber(storage_amount_per_byte),
    gasPrice: new BigNumber(gasPrice),
    createAccountCostSend: new BigNumber(action_creation_config.create_account_cost.send_not_sir),
    createAccountCostExecution: new BigNumber(action_creation_config.create_account_cost.execution),
    transferCostSend: new BigNumber(action_creation_config.transfer_cost.send_not_sir),
    transferCostExecution: new BigNumber(action_creation_config.transfer_cost.execution),
    addKeyCostSend: new BigNumber(
      action_creation_config.add_key_cost.full_access_cost.send_not_sir,
    ),
    addKeyCostExecution: new BigNumber(
      action_creation_config.add_key_cost.full_access_cost.execution,
    ),
    receiptCreationSend: new BigNumber(action_receipt_creation_config.send_not_sir),
    receiptCreationExecution: new BigNumber(action_receipt_creation_config.execution),
    validators,
  };
};

export const hydrate = (data: any): void => {
  const hydrated = fromHydratePreloadData(data);

  log("near/preload", `hydrated storageCost with ${hydrated.storageCost}`);

  setNearPreloadData(hydrated);
};
