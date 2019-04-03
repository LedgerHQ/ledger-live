// @flow

import type { CurrencyBridge } from "@ledgerhq/live-common/lib/bridge/types";
import { scanAccountsOnDevice } from "@ledgerhq/live-common/lib/libcore/scanAccountsOnDevice";

const currencyBridge: CurrencyBridge = {
  scanAccountsOnDevice,
};

export default currencyBridge;
