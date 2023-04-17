/* eslint-disable no-console */
import "crypto";
import { v4 as uuid } from "uuid";
import * as Sentry from "@sentry/react-native";
import Config from "react-native-config";
import { Platform } from "react-native";
import { createClient, SegmentClient } from "@segment/analytics-react-native";
import VersionNumber from "react-native-version-number";
import RNLocalize from "react-native-localize";
import { ReplaySubject } from "rxjs";
import {
  getFocusedRouteNameFromRoute,
  ParamListBase,
  RouteProp,
  useRoute,
} from "@react-navigation/native";
import { snakeCase } from "lodash";
import { useCallback } from "react";
import { idsToLanguage } from "@ledgerhq/types-live";
import {
  getAndroidArchitecture,
  getAndroidVersionCode,
} from "../logic/cleanBuildVersion";
import getOrCreateUser from "../user";
import {
  analyticsEnabledSelector,
  languageSelector,
  localeSelector,
  lastSeenDeviceSelector,
  sensitiveAnalyticsSelector,
  firstConnectionHasDeviceSelector,
  firstConnectHasDeviceUpdatedSelector,
  readOnlyModeEnabledSelector,
  hasOrderedNanoSelector,
  notificationsSelector,
  knownDeviceModelIdsSelector,
  customImageTypeSelector,
} from "../reducers/settings";
import { knownDevicesSelector } from "../reducers/ble";
import { DeviceLike, State } from "../reducers/types";
import { satisfactionSelector } from "../reducers/ratings";
import { accountsSelector } from "../reducers/accounts";
import type { AppStore } from "../reducers";
import { NavigatorName } from "../const";
import { previousRouteNameRef, currentRouteNameRef } from "./screenRefs";
import { AnonymousIpPlugin } from "./AnonymousIpPlugin";
import { UserIdPlugin } from "./UserIdPlugin";
import { Maybe } from "../types/helpers";
import {
  GENESIS_PASS_COLLECTION_CONTRACT,
  INFINITY_PASS_COLLECTION_CONTRACT,
  hasNftInAccounts,
} from "../helpers/nfts";
import { appStartupTime } from "../StartupTimeMarker";

let sessionId = uuid();
const appVersion = `${VersionNumber.appVersion || ""} (${
  VersionNumber.buildVersion || ""
})`;
const { ANALYTICS_LOGS, ANALYTICS_TOKEN } = Config;

export const updateSessionId = () => (sessionId = uuid());

const extraProperties = async (store: AppStore) => {
  const state: State = store.getState();
  const sensitiveAnalytics = sensitiveAnalyticsSelector(state);
  const systemLanguage = sensitiveAnalytics
    ? null
    : RNLocalize.getLocales()[0]?.languageTag;
  const knownDeviceModelIds = knownDeviceModelIdsSelector(state);
  const customImageType = customImageTypeSelector(state);
  const language = sensitiveAnalytics ? null : languageSelector(state);
  const region = sensitiveAnalytics ? null : localeSelector(state);
  const devices = knownDevicesSelector(state);
  const satisfaction = satisfactionSelector(state);
  const accounts = accountsSelector(state);
  const lastDevice =
    lastSeenDeviceSelector(state) || devices[devices.length - 1];
  const deviceInfo = lastDevice
    ? {
        deviceVersion: lastDevice.deviceInfo?.version,
        deviceLanguage:
          lastDevice.deviceInfo?.languageId !== undefined
            ? idsToLanguage[lastDevice.deviceInfo.languageId]
            : undefined,
        appLength: (lastDevice as DeviceLike)?.appsInstalled,
        modelId: lastDevice.modelId,
      }
    : {};
  const firstConnectionHasDevice = firstConnectionHasDeviceSelector(state);
  const notifications = notificationsSelector(state);
  const notificationsAllowed = notifications.areNotificationsAllowed;
  const notificationsBlacklisted = Object.entries(notifications)
    .filter(
      ([key, value]) => key !== "areNotificationsAllowed" && value === false,
    )
    .map(([key]) => key);
  const firstConnectHasDeviceUpdated =
    firstConnectHasDeviceUpdatedSelector(state);
  const { user } = await getOrCreateUser();
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
          accounts
            .filter(account => account.nfts?.length)
            .map(account => account.currency.ticker),
        ),
      ]
    : [];
  const hasGenesisPass = hasNftInAccounts(
    GENESIS_PASS_COLLECTION_CONTRACT,
    accounts,
  );
  const hasInfinityPass = hasNftInAccounts(
    INFINITY_PASS_COLLECTION_CONTRACT,
    accounts,
  );

  return {
    appVersion,
    androidVersionCode: getAndroidVersionCode(VersionNumber.buildVersion),
    androidArchitecture: getAndroidArchitecture(VersionNumber.buildVersion),
    environment: ANALYTICS_LOGS ? "development" : "production",
    systemLanguage: sensitiveAnalytics ? null : systemLanguage,
    language,
    appLanguage: language, // In Braze it can't be called language
    region: region?.split("-")[1] || region,
    platformOS: Platform.OS,
    platformVersion: Platform.Version,
    sessionId,
    devicesCount: devices.length,
    firstConnectionHasDevice,
    firstConnectHasDeviceUpdated,
    ...(satisfaction
      ? {
          satisfaction,
        }
      : {}),
    ...deviceInfo,
    notificationsAllowed,
    notificationsBlacklisted,
    userId: user?.id,
    accountsWithFunds,
    blockchainsWithNftsOwned,
    hasGenesisPass,
    hasInfinityPass,
    appTimeToInteractiveMilliseconds: appStartupTime,
    staxDeviceUser: knownDeviceModelIds.stax,
    staxLockscreen: customImageType || "none",
  };
};

type MaybeAppStore = Maybe<AppStore>;

let storeInstance: MaybeAppStore; // is the redux store. it's also used as a flag to know if analytics is on or off.
let segmentClient: SegmentClient | undefined;

const token = ANALYTICS_TOKEN;
export const start = async (
  store: AppStore,
): Promise<SegmentClient | undefined> => {
  const { user, created } = await getOrCreateUser();
  storeInstance = store;

  if (created && ANALYTICS_LOGS) {
    console.log("analytics:identify", user.id);
  }

  console.log("START ANALYTICS", ANALYTICS_LOGS);
  const userExtraProperties = await extraProperties(store);
  if (token) {
    segmentClient = createClient({
      writeKey: token,
      debug: !!ANALYTICS_LOGS,
    });
    // This allows us to not retrieve users ip addresses for privacy reasons
    segmentClient.add({ plugin: new AnonymousIpPlugin() });
    // This allows us to make sure we are adding the userId to the event
    segmentClient.add({ plugin: new UserIdPlugin() });

    if (created) {
      segmentClient.reset();
    }
    await segmentClient.identify(user.id, userExtraProperties);
  }
  await track("Start", userExtraProperties, true);

  return segmentClient;
};
export const updateIdentify = async () => {
  Sentry.addBreadcrumb({
    category: "identify",
    level: "debug",
  });

  if (!storeInstance || !analyticsEnabledSelector(storeInstance.getState())) {
    return;
  }

  const userExtraProperties = await extraProperties(storeInstance);
  if (ANALYTICS_LOGS) console.log("analytics:identify", userExtraProperties);
  if (!token) return;
  await segmentClient?.identify(
    userExtraProperties.userId,
    userExtraProperties,
  );
};
export const stop = () => {
  if (ANALYTICS_LOGS) console.log("analytics:stop");
  storeInstance = null;
};

type Properties = Error | Record<string, unknown> | null;
export type LoggableEvent = {
  eventName: string;
  eventProperties?: Properties;
  eventPropertiesWithoutExtra?: Properties;
  date: Date;
};
export const trackSubject = new ReplaySubject<LoggableEvent>(30);

type EventType = string | "button_clicked" | "error_message";

export function getIsTracking(
  state: State | null | undefined,
  mandatory?: boolean | null | undefined,
): { enabled: true } | { enabled: false; reason?: string } {
  if (!state) return { enabled: false, reason: "store not initialised" };
  const readOnlyMode = state && readOnlyModeEnabledSelector(state);
  const hasOrderedNano = state && hasOrderedNanoSelector(state);
  const analyticsEnabled = state && analyticsEnabledSelector(state);
  if (readOnlyMode && hasOrderedNano)
    return {
      enabled: false,
      reason:
        "not tracking anything in the reborn state post purchase pre device setup",
    };
  if (!mandatory && !analyticsEnabled) {
    return {
      enabled: false,
      reason: "analytics not enabled",
    };
  }
  return { enabled: true };
}

export const track = async (
  event: EventType,
  eventProperties?: Error | Record<string, unknown> | null,
  mandatory?: boolean | null,
) => {
  Sentry.addBreadcrumb({
    message: event,
    category: "track",
    data: eventProperties || undefined,
    level: "debug",
  });

  const state = storeInstance && storeInstance.getState();

  const isTracking = getIsTracking(state, mandatory);
  if (!isTracking.enabled) {
    if (ANALYTICS_LOGS)
      console.log("analytics:track: not tracking because: ", isTracking.reason);
    return;
  }

  const screen = currentRouteNameRef.current;

  const userExtraProperties = await extraProperties(storeInstance as AppStore);
  const propertiesWithoutExtra = {
    screen,
    ...eventProperties,
  };
  const allProperties = {
    ...propertiesWithoutExtra,
    ...userExtraProperties,
  };
  if (ANALYTICS_LOGS) console.log("analytics:track", event, allProperties);
  trackSubject.next({
    eventName: event,
    eventProperties: allProperties,
    eventPropertiesWithoutExtra: propertiesWithoutExtra,
    date: new Date(),
  });
  if (!token) return;
  segmentClient?.track(event, allProperties);
};
export const getPageNameFromRoute = (route: RouteProp<ParamListBase>) => {
  const routeName =
    getFocusedRouteNameFromRoute(route) || NavigatorName.Portfolio;
  return snakeCase(routeName);
};
export const trackWithRoute = (
  event: EventType,
  route: RouteProp<ParamListBase>,
  properties?: Record<string, unknown> | null,
  mandatory?: boolean | null,
) => {
  const newProperties = {
    page: getPageNameFromRoute(route),
    // don't override page if it's already set
    ...(properties || {}),
  };
  track(event, newProperties, mandatory);
};
export const useTrack = () => {
  const route = useRoute();
  const track = useCallback(
    (
      event: EventType,
      properties?: Record<string, unknown> | null,
      mandatory?: boolean | null,
    ) => trackWithRoute(event, route, properties, mandatory),
    [route],
  );
  return track;
};
export const usePageNameFromRoute = () => {
  const route = useRoute();
  return getPageNameFromRoute(route);
};
export const useAnalytics = () => {
  const track = useTrack();
  const page = usePageNameFromRoute();
  return {
    track,
    page,
  };
};
export const screen = async (
  category?: string,
  name?: string | null,
  properties?: Record<string, unknown> | null | undefined,
) => {
  const title = `Page ${category + (name ? ` ${name}` : "")}`;
  Sentry.addBreadcrumb({
    message: title,
    category: "screen",
    data: properties || {},
    level: "info",
  });

  const state = storeInstance && storeInstance.getState();

  const isTracking = getIsTracking(state);
  if (!isTracking.enabled) {
    if (ANALYTICS_LOGS)
      console.log(
        "analytics:screen: not tracking because: ",
        isTracking.reason,
      );
    return;
  }

  const source = previousRouteNameRef.current;

  const userExtraProperties = await extraProperties(storeInstance as AppStore);
  const eventPropertiesWithoutExtra = {
    source,
    ...properties,
  };
  const allProperties = {
    ...eventPropertiesWithoutExtra,
    ...userExtraProperties,
  };
  if (ANALYTICS_LOGS)
    console.log("analytics:screen", category, name, allProperties);
  trackSubject.next({
    eventName: title,
    eventProperties: allProperties,
    eventPropertiesWithoutExtra,
    date: new Date(),
  });
  if (!token) return;
  segmentClient?.track(title, allProperties);
};
