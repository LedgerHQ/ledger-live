import type { AccountBridge, CurrencyBridge } from "../../../types";
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
  asSafeCosmosPreloadData,
  setCosmosPreloadData,
} from "../../cosmos/preloadedData";

const preload = () => Promise.resolve({});
const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  preload,
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
    setCosmosPreloadData(asSafeCosmosPreloadData(data));
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
  broadcast: osmosisAPI.broadcast,
};

export default { currencyBridge, accountBridge };
