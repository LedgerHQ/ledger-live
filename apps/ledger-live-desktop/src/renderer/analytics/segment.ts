import { v4 as uuid } from "uuid";
import invariant from "invariant";
import { ReplaySubject } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import logger from "~/renderer/logger";
import { getParsedSystemLocale } from "~/helpers/systemLocale";
import user from "~/helpers/user";
import {
  sidebarCollapsedSelector,
  shareAnalyticsSelector,
  lastSeenDeviceSelector,
  localeSelector,
  languageSelector,
  devicesModelListSelector,
} from "~/renderer/reducers/settings";
import { State } from "~/renderer/reducers";
import { AccountLike, Feature, FeatureId, Features, idsToLanguage } from "@ledgerhq/types-live";
import { getAccountName } from "@ledgerhq/live-common/account/index";
import { accountsSelector } from "../reducers/accounts";
import {
  GENESIS_PASS_COLLECTION_CONTRACT,
  hasNftInAccounts,
  INFINITY_PASS_COLLECTION_CONTRACT,
} from "@ledgerhq/live-common/nft/helpers";
import createStore from "../createStore";
import { currentRouteNameRef, previousRouteNameRef } from "./screenRefs";
import { useCallback, useContext } from "react";
import { analyticsDrawerContext } from "../drawers/Provider";
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

let storeInstance: ReduxStore | null | undefined; // is the redux store. it's also used as a flag to know if analytics is on or off.
let analyticsFeatureFlagMethod:
  | null
  | (<T extends FeatureId>(key: T) => Feature<Features[T]["params"]> | null);

export function setAnalyticsFeatureFlagMethod(method: typeof analyticsFeatureFlagMethod): void {
  analyticsFeatureFlagMethod = method;
}

const getFeatureFlagProperties = (): Record<string, boolean | string> => {
  try {
    if (!analyticsFeatureFlagMethod) return {};
    const ptxEarnFeatureFlag = analyticsFeatureFlagMethod("ptxEarn");
    const fetchAdditionalCoins = analyticsFeatureFlagMethod("fetchAdditionalCoins");

    const isBatch1Enabled =
      !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 1;
    const isBatch2Enabled =
      !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 2;
    const isBatch3Enabled =
      !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 3;

    return {
      ptxEarnEnabled: !!ptxEarnFeatureFlag?.enabled,
      isBatch1Enabled,
      isBatch2Enabled,
      isBatch3Enabled,
    };
  } catch (e) {
    return {};
  }
};

const extraProperties = (store: ReduxStore) => {
  const state: State = store.getState();
  const language = languageSelector(state);
  const region = (localeSelector(state).split("-")[1] || "").toUpperCase() || null;
  const systemLocale = getParsedSystemLocale();
  const device = lastSeenDeviceSelector(state);
  const devices = devicesModelListSelector(state);
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
    modelIdList: devices,
    ...deviceInfo,
    ...getFeatureFlagProperties(),
  };
};

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
  const allProperties = {
    ...extraProperties(store),
    braze_external_id: id, // Needed for braze with this exact name
  };
  logger.analyticsStart(id, allProperties);
  analytics.identify(id, allProperties, {
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
type Properties = Error | Record<string, unknown> | null;
export type LoggableEvent = {
  eventName: string;
  eventProperties?: Properties;
  eventPropertiesWithoutExtra?: Properties;
  date: Date;
};
export const trackSubject = new ReplaySubject<LoggableEvent>(30);
function sendTrack(event: string, properties: object | undefined | null) {
  const analytics = getAnalytics();
  if (!analytics) return;
  analytics.track(event, properties, {
    context: getContext(),
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

export const updateIdentify = async () => {
  if (!storeInstance || !shareAnalyticsSelector(storeInstance.getState())) return;

  const analytics = getAnalytics();
  const { id } = await user();

  const allProperties = {
    ...extraProperties(storeInstance),
    braze_external_id: id, // Needed for braze with this exact name
  };
  analytics.identify(id, allProperties, {
    context: getContext(),
  });
};

export const track = (
  eventName: string,
  properties?: Record<string, unknown> | null,
  mandatory?: boolean | null,
) => {
  if (!storeInstance || (!mandatory && !shareAnalyticsSelector(storeInstance.getState()))) {
    return;
  }

  const eventPropertiesWithoutExtra = {
    ...properties,
    page: currentRouteNameRef.current,
  };
  const allProperties = {
    ...eventPropertiesWithoutExtra,
    ...extraProperties(storeInstance),
    ...confidentialityFilter(properties),
  };

  logger.analyticsTrack(eventName, allProperties);
  sendTrack(eventName, allProperties);
  trackSubject.next({
    eventName,
    eventProperties: allProperties,
    eventPropertiesWithoutExtra,
    date: new Date(),
  });
};

/**
 * Returns an enriched track function that uses the context to add contextual
 * props to events.
 *
 * For now it's only adding the "drawer" property if it's defined.
 * */
export function useTrack() {
  const { analyticsDrawerName } = useContext(analyticsDrawerContext);
  return useCallback(
    (
      eventName: string,
      properties?: Record<string, unknown> | null,
      mandatory?: boolean | null,
    ) => {
      track(
        eventName,
        {
          ...(analyticsDrawerName ? { drawer: analyticsDrawerName } : {}),
          ...(properties ?? {}),
        },
        mandatory,
      );
    },
    [analyticsDrawerName],
  );
}

/**
 * Track an event which will have the name `Page ${category}${name ? " " + name : ""}`.
 * Extra logic to update the route names used in "screen" and "source"
 * properties of further events can be optionally enabled with the parameters
 * `updateRoutes` and `refreshSource`.
 */
export const trackPage = (
  /**
   * First part of the event name string
   */
  category: string,
  /**
   * Second part of the event name string, will be concatenated to `category`
   * after a whitespace if defined.
   */
  name?: string | null,
  /**
   * Event properties
   */
  properties?: object | null,
  /**
   * Should this function call update the previous & current route names.
   * Previous and current route names are used to track:
   * - the `screen` property in non-screen events (for instance `button_clicked` events)
   * - the `source` property in further screen events
   */
  updateRoutes?: boolean,
  /**
   * Should this function call update the current route name.
   * If true, it means that the full screen name (`category` + " " + `name`) will
   * be used as a "source" property for further screen events.
   * NB: the previous parameter `updateRoutes` must be true for this to have
   * any effect.
   */
  refreshSource?: boolean,
) => {
  if (!storeInstance || !shareAnalyticsSelector(storeInstance.getState())) {
    return;
  }

  const fullScreenName = category + (name ? ` ${name}` : "");
  if (updateRoutes) {
    previousRouteNameRef.current = currentRouteNameRef.current;
    if (refreshSource) {
      currentRouteNameRef.current = fullScreenName;
    }
  }
  const eventName = `Page ${fullScreenName}`;

  const eventPropertiesWithoutExtra = {
    source: previousRouteNameRef.current ?? undefined,
    ...properties,
  };
  const allProperties = {
    ...eventPropertiesWithoutExtra,
    ...extraProperties(storeInstance),
  };
  logger.analyticsPage(category, name, allProperties);
  sendTrack(eventName, allProperties);
  trackSubject.next({
    eventName,
    eventProperties: allProperties,
    eventPropertiesWithoutExtra,
    date: new Date(),
  });
};
