import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { sync, scanAccounts } from "../js-synchronization";
import {
  createTransaction,
  updateTransaction,
  prepareTransaction,
} from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import signOperation from "../js-signOperation";
import { osmosisAPI } from "../api/sdk";
import osmosisValidatorsManager from "../validators";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import { CosmosValidatorItem } from "../../cosmos/types";
import {
  asSafeOsmosisPreloadData,
  setOsmosisPreloadData,
} from "../../osmosis/preloadedData";

const receive = makeAccountBridgeReceive();
const getPreloadStrategy = (_currency) => ({
  preloadMaxAge: 30 * 1000,
});

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload: async () => {
    const validators = await osmosisValidatorsManager.getValidators();
    setOsmosisPreloadData({
      validators,
    });
    return Promise.resolve({
      validators,
    });
  },
  hydrate: (data: { validators?: CosmosValidatorItem[] }) => {
    if (!data || typeof data !== "object") return;
    const { validators } = data;
    if (
      !validators ||
      typeof validators !== "object" ||
      !Array.isArray(validators)
    )
      return;
    osmosisValidatorsManager.hydrateValidators(validators);
    setOsmosisPreloadData(asSafeOsmosisPreloadData(data));
  },
  scanAccounts,
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast: osmosisAPI?.broadcast,
};

export default { currencyBridge, accountBridge };
