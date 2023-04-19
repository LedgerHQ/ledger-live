import { v4 as uuid } from "uuid";
import invariant from "invariant";
import { ReplaySubject } from "rxjs";
import { getEnv } from "@ledgerhq/live-common/env";
import logger from "~/renderer/logger";
import { getParsedSystemLocale } from "~/helpers/systemLocale";
import user from "~/helpers/user";
import {
  sidebarCollapsedSelector,
  shareAnalyticsSelector,
  lastSeenDeviceSelector,
  localeSelector,
  languageSelector,
} from "~/renderer/reducers/settings";
import { State } from "~/renderer/reducers";
import { AccountLike, idsToLanguage } from "@ledgerhq/types-live";
import { getAccountName } from "@ledgerhq/live-common/account/index";
import { accountsSelector } from "../reducers/accounts";
import {
  GENESIS_PASS_COLLECTION_CONTRACT,
  hasNftInAccounts,
  INFINITY_PASS_COLLECTION_CONTRACT,
} from "@ledgerhq/live-common/nft/helpers";
import createStore from "../createStore";
invariant(typeof window !== "undefined", "analytics/segment must be called on renderer thread");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require("os");
const osType = os.type();
const osVersion = os.release();
const sessionId = uuid();
const getContext = () => ({
  ip: "0.0.0.0",
  page: {
    path: "/",
    referrer: "",
    search: "",
    title: "Ledger Live",
    url: "",
  },
});

type ReduxStore = ReturnType<typeof createStore>;

const extraProperties = (store: ReduxStore) => {
  const state: State = store.getState();
  const language = languageSelector(state);
  const region = (localeSelector(state).split("-")[1] || "").toUpperCase() || null;
  const systemLocale = getParsedSystemLocale();
  const device = lastSeenDeviceSelector(state);
  const accounts = accountsSelector(state);
  const deviceInfo = device
    ? {
        modelId: device.modelId,
        deviceVersion: device.deviceInfo.version,
        deviceLanguage:
          device.deviceInfo?.languageId !== undefined
            ? idsToLanguage[device.deviceInfo.languageId]
            : undefined,
        appLength: device.apps?.length,
      }
    : {};
  const sidebarCollapsed = sidebarCollapsedSelector(state);

  const accountsWithFunds = accounts
    ? [
        ...new Set(
          accounts
            .filter(account => account?.balance.isGreaterThan(0))
            .map(account => account?.currency?.ticker),
        ),
      ]
    : [];
  const blockchainsWithNftsOwned = accounts
    ? [
        ...new Set(
          accounts.filter(account => account.nfts?.length).map(account => account.currency.ticker),
        ),
      ]
    : [];
  const hasGenesisPass = hasNftInAccounts(GENESIS_PASS_COLLECTION_CONTRACT, accounts);
  const hasInfinityPass = hasNftInAccounts(INFINITY_PASS_COLLECTION_CONTRACT, accounts);
  return {
    appVersion: __APP_VERSION__,
    language,
    appLanguage: language, // Needed for braze
    region,
    environment: process.env.SEGMENT_TEST ? "test" : __DEV__ ? "development" : "production",
    systemLanguage: systemLocale.language,
    systemRegion: systemLocale.region,
    osType,
    osVersion,
    sessionId,
    sidebarCollapsed,
    accountsWithFunds,
    blockchainsWithNftsOwned,
    hasGenesisPass,
    hasInfinityPass,
    ...deviceInfo,
  };
};
let storeInstance: ReduxStore | null | undefined; // is the redux store. it's also used as a flag to know if analytics is on or off.

function getAnalytics() {
  const { analytics } = window;
  if (typeof analytics === "undefined") {
    logger.critical(new Error("window.analytics must not be undefined!"));
  }
  return analytics;
}
export const start = async (store: ReduxStore) => {
  if (!user || (!process.env.SEGMENT_TEST && (getEnv("MOCK") || getEnv("PLAYWRIGHT_RUN")))) return;
  const { id } = await user();
  storeInstance = store;
  const analytics = getAnalytics();
  if (!analytics) return;
  logger.analyticsStart(id, extraProperties(store));
  analytics.identify(id, extraProperties(store), {
    context: getContext(),
  });
};
export const stop = () => {
  logger.analyticsStop();
  storeInstance = null;
  const analytics = getAnalytics();
  if (!analytics) return;
  analytics.reset();
};
export const trackSubject = new ReplaySubject<{
  event: string;
  properties: object | undefined | null;
}>(10);
function sendTrack(event: string, properties: object | undefined | null) {
  const analytics = getAnalytics();
  if (!analytics) return;
  analytics.track(event, properties, {
    context: getContext(),
  });
  trackSubject.next({
    event,
    properties,
  });
}

const confidentialityFilter = (properties?: Record<string, unknown> | null) => {
  const { account, parentAccount } = properties || {};
  const filterAccount = account
    ? { account: typeof account === "object" ? getAccountName(account as AccountLike) : account }
    : {};
  const filterParentAccount = parentAccount
    ? {
        parentAccount:
          typeof parentAccount === "object"
            ? getAccountName(parentAccount as AccountLike)
            : parentAccount,
      }
    : {};
  return {
    ...properties,
    ...filterAccount,
    ...filterParentAccount,
  };
};

export const track = (
  event: string,
  properties?: Record<string, unknown> | null,
  mandatory?: boolean | null,
) => {
  if (!storeInstance || (!mandatory && !shareAnalyticsSelector(storeInstance.getState()))) {
    return;
  }
  const fullProperties = {
    ...extraProperties(storeInstance),
    ...confidentialityFilter(properties),
  };
  logger.analyticsTrack(event, fullProperties);
  sendTrack(event, fullProperties);
};
export const page = (category: string, name?: string | null, properties?: object | null) => {
  if (!storeInstance || !shareAnalyticsSelector(storeInstance.getState())) {
    return;
  }
  const fullProperties = {
    ...extraProperties(storeInstance),
    ...properties,
  };
  logger.analyticsPage(category, name, fullProperties);
  sendTrack(`Page ${category + (name ? ` ${name}` : "")}`, fullProperties);
};
