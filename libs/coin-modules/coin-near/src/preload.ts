import { log } from "@ledgerhq/logs";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import BigNumber from "bignumber.js";
import { VALIDATORS_COUNT } from "./constants";
import { getGasPrice, getValidators } from "./network/node";
import { getActionCosts } from "./network/protocolConfig";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";
import { getCoinConfig } from "./config";
import type { NearPreloadedData } from "./types";

export { getCurrentNearPreloadData };

const PRELOAD_MAX_AGE = 30 * 60 * 1000;

function fromHydratePreloadData(data: any): NearPreloadedData {
  const hydratedData = Object.assign({}, getCurrentNearPreloadData());

  if (typeof data === "object" && data) {
    hydratedData.storageCost = parseFiniteBigNumber(data.storageCost) ?? hydratedData.storageCost;
    hydratedData.gasPrice = parseFiniteBigNumber(data.gasPrice) ?? hydratedData.gasPrice;
    hydratedData.createAccountCostSend =
      parseFiniteBigNumber(data.createAccountCostSend) ?? hydratedData.createAccountCostSend;
    hydratedData.createAccountCostExecution =
      parseFiniteBigNumber(data.createAccountCostExecution) ??
      hydratedData.createAccountCostExecution;
    hydratedData.transferCostSend =
      parseFiniteBigNumber(data.transferCostSend) ?? hydratedData.transferCostSend;
    hydratedData.transferCostExecution =
      parseFiniteBigNumber(data.transferCostExecution) ?? hydratedData.transferCostExecution;
    hydratedData.addKeyCostSend =
      parseFiniteBigNumber(data.addKeyCostSend) ?? hydratedData.addKeyCostSend;
    hydratedData.addKeyCostExecution =
      parseFiniteBigNumber(data.addKeyCostExecution) ?? hydratedData.addKeyCostExecution;
    hydratedData.receiptCreationSend =
      parseFiniteBigNumber(data.receiptCreationSend) ?? hydratedData.receiptCreationSend;
    hydratedData.receiptCreationExecution =
      parseFiniteBigNumber(data.receiptCreationExecution) ?? hydratedData.receiptCreationExecution;
    hydratedData.minGasPurchasePrice =
      parseFiniteBigNumber(data.minGasPurchasePrice) ?? hydratedData.minGasPurchasePrice;
    hydratedData.accountCreationCharge =
      parseFiniteBigNumber(data.accountCreationCharge) ?? hydratedData.accountCreationCharge;
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
  const config = getCoinConfig();
  const [actionCosts, rawValidators, gasPrice] = await Promise.all([
    getActionCosts.force(config),
    getValidators({ total: VALIDATORS_COUNT, config }),
    getGasPrice(config),
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
