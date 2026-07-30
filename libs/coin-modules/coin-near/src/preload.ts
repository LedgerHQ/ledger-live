import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import { VALIDATORS_COUNT } from "./constants";
import { getGasPrice, getValidators } from "./network/node";
import { getActionCosts } from "./network/protocolConfig";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";
import type { NearPreloadedData } from "./types";

export { getCurrentNearPreloadData };

const PRELOAD_MAX_AGE = 30 * 60 * 1000;

function fromHydratePreloadData(data: any): NearPreloadedData {
  const hydratedData = Object.assign({}, getCurrentNearPreloadData());

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

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

export const preload = async (): Promise<NearPreloadedData> => {
  log("near/preload", "preloading near data...");

  // `force` so a preload always refreshes the protocol config, as it did before the derivation
  // moved behind a cache; it also refills that cache for callers outside a bridge sync.
  const [actionCosts, rawValidators, gasPrice] = await Promise.all([
    getActionCosts.force(),
    getValidators({ total: VALIDATORS_COUNT }),
    getGasPrice(),
  ]);

  const validators = rawValidators.map(({ account_id: validatorAddress, stake, commission }) => ({
    validatorAddress,
    tokens: stake,
    commission,
  }));

  return {
    ...actionCosts,
    gasPrice: new BigNumber(gasPrice),
    validators,
  };
};

export const hydrate = (data: any): void => {
  const hydrated = fromHydratePreloadData(data);

  log("near/preload", `hydrated storageCost with ${hydrated.storageCost}`);

  setNearPreloadData(hydrated);
};
