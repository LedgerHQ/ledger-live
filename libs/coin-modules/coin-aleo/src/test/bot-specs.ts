import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "../types";
import { acceptTransaction } from "./speculos-deviceActions";

const aleoSpecs: AppSpec<Transaction> = {
  name: "Aleo",
  currency: getCryptoCurrencyById("aleo"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Aleo",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  mutations: [],
};

export default {
  aleoSpecs,
};
