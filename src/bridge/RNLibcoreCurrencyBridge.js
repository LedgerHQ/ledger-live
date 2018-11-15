// @flow

import type { CurrencyBridge } from "./types";
import { scanAccountsOnDevice } from "../libcore/scanAccountsOnDevice";

const currencyBridge: CurrencyBridge = {
  scanAccountsOnDevice,
};

export default currencyBridge;
