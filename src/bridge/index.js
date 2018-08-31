// @flow

// FIXME NB: goal for "bridge/" folder is to be moved to live-common and used by desktop again!

import type { Currency } from "@ledgerhq/live-common/lib/types";
import invariant from "invariant";
import { WalletBridge } from "./types";
import makeMockBridge from "./makeMockBridge";
// import EthereumJSBridge from "./EthereumJSBridge";

const perFamily = {
  stellar: null,
  ethereum: makeMockBridge(),
  bitcoin: makeMockBridge(),
  ripple: makeMockBridge(),
};

const USE_MOCK_DATA = true;

if (USE_MOCK_DATA) {
  const mockBridge = makeMockBridge();
  perFamily.bitcoin = mockBridge;
  perFamily.ethereum = mockBridge;
  perFamily.ripple = mockBridge;
}

export const getBridgeForCurrency = (currency: Currency): WalletBridge<any> => {
  const bridge = perFamily[currency.family];
  invariant(bridge, `${currency.id} currency is not supported`);
  return bridge;
};
