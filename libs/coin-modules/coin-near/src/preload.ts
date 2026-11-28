import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { getGasPrice } from "./network/node";
import { getActionCosts } from "./network/protocolConfig";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";
import { getCoinConfig } from "./config";
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
    if (data.minGasPurchasePrice) {
      hydratedData.minGasPurchasePrice = new BigNumber(data.minGasPurchasePrice);
    }
    if (data.accountCreationCharge) {
      hydratedData.accountCreationCharge = new BigNumber(data.accountCreationCharge);
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
  // Validators are not preloaded: the staking screens and the banner load them when shown.
  const config = getCoinConfig();
  const [actionCosts, gasPrice] = await Promise.all([
    getActionCosts.force(config),
    getGasPrice(config),
  ]);

  return {
    ...actionCosts,
    gasPrice: new BigNumber(gasPrice),
  };
};

export const hydrate = (data: any): void => {
  const hydrated = fromHydratePreloadData(data);

  log("near/preload", `hydrated storageCost with ${hydrated.storageCost}`);

  setNearPreloadData(hydrated);
};
