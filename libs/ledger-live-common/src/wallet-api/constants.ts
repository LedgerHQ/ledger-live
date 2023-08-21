import Fuse from "fuse.js";
import { AppManifest } from "../wallet-api/types";

export { FAMILIES as WALLET_API_FAMILIES } from "@ledgerhq/wallet-api-core";

export const WALLET_API_VERSION = "2.0.0";

export const BROWSE_SEARCH_OPTIONS: Fuse.IFuseOptions<AppManifest> = {
  keys: ["name", "categories"],
  threshold: 0.1,
};

export const HTTP_REGEX = new RegExp(
  /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi,
);

export const INITIAL_PLATFORM_STATE = { recentlyUsed: [] };

export const MAX_RECENTLY_USED_LENGTH = 10;

export const DAPP_DISCLAIMER_ID = "PlatformAppDisclaimer";

export const DISCOVER_STORE_KEY = "discover";

export const DISCOVER_INITIAL_CATEGORY = "all";
