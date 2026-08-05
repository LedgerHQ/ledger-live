import {
  FF_BORROW_MOBILE,
  FF_LWM_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
} from "../../utils/featureFlagUtils";

import type { OptionalFeatureMap } from "@shared/feature-flags";

export const BORROW_FEATURE_FLAGS: OptionalFeatureMap = {
  ...FF_LWM_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
  ...FF_BORROW_MOBILE,
  lwmWallet40: {
    ...FF_LWM_WALLET_40_Q2_NO_ANALYTICS_CONSENT.lwmWallet40,
    params: {
      ...FF_LWM_WALLET_40_Q2_NO_ANALYTICS_CONSENT.lwmWallet40?.params,
      pnl: true,
    },
  },
};

export const BORROW_HOOK_TIMEOUT_MS = 600_000;
export const BORROW_TEST_TIMEOUT_MS = 480_000;
/** No on-chain setup; covers initBorrowApp + portfolio/borrow webview entry flakes. */
export const BORROW_COLD_START_TEST_TIMEOUT_MS = 120_000;
