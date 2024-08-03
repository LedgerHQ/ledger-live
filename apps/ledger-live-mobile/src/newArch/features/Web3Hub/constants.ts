import type { Web3HubDB } from "./types";

export const URL_ORIGIN = "https://live-app-catalog.ledger.com";

export const WEB3HUB_STORE_KEY = "web3hub";

export const INITIAL_WEB3HUB_STATE: Web3HubDB = {
  recentlyUsed: [],
  dismissedManifests: {},
  // localLiveApp: [],
};
