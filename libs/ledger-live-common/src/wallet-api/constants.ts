import Fuse from "fuse.js";
import { AppManifest } from "../wallet-api/types";

import { FAMILIES } from "@ledgerhq/wallet-api-core";
import { reverseRecord } from "../helpers";

export const FAMILIES_MAPPING_WAPI_TO_LL = {
  ethereum: "evm",
  ripple: "xrp",
} as const;

export const FAMILIES_MAPPING_LL_TO_WAPI = reverseRecord(FAMILIES_MAPPING_WAPI_TO_LL);

/**
 * FIXME
 * This is not robust, we should have an explicit adapter between the wallet API currencies (families) and live currencies (families)
 * For example here, the `ethereum` family on `wallet-api` should be mapped to the `evm` family on LL
 */
export const WALLET_API_FAMILIES = [...FAMILIES, ...Object.values(FAMILIES_MAPPING_WAPI_TO_LL)];

export const WALLET_API_VERSION = "2.0.0";

export const BROWSE_SEARCH_OPTIONS: Fuse.IFuseOptions<AppManifest> = {
  keys: ["name", "categories"],
  threshold: 0.1,
};

export const HTTP_REGEX = new RegExp(
  /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi,
);

export const INITIAL_PLATFORM_STATE = {
  recentlyUsed: [],
  currentAccountHist: {},
  cacheBustedLiveApps: { init: 1 },
  localLiveApp: [],
};

export const MAX_RECENTLY_USED_LENGTH = 10;

export const DAPP_DISCLAIMER_ID = "PlatformAppDisclaimer";

export const DISCOVER_STORE_KEY = "discover";

export const DISCOVER_INITIAL_CATEGORY = "all";

export const DEFAULT_MULTIBUY_APP_ID = "multibuy-v2";

export const BUY_SELL_UI_APP_ID = "buy-sell-ui";

export const CARD_APP_ID = "card-program";

export const WC_ID = "ledger-wallet-connect";

export const INTERNAL_APP_IDS = [DEFAULT_MULTIBUY_APP_ID, BUY_SELL_UI_APP_ID, CARD_APP_ID];
