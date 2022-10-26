/* eslint-disable no-console */
import "crypto";
import { v4 as uuid } from "uuid";
import * as Sentry from "@sentry/react-native";
import Config from "react-native-config";
import { Platform } from "react-native";
import analytics, { JsonMap } from "@segment/analytics-react-native";
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
// eslint-disable-next-line import/no-cycle
import {
  analyticsEnabledSelector,
  languageSelector,
  localeSelector,
  lastSeenDeviceSelector,
  sensitiveAnalyticsSelector,
  firstConnectionHasDeviceSelector,
  readOnlyModeEnabledSelector,
  hasOrderedNanoSelector,
} from "../reducers/settings";
import { knownDevicesSelector } from "../reducers/ble";
import { DeviceLike, State } from "../reducers/types";
import { satisfactionSelector } from "../reducers/ratings";
import type { AppStore } from "../reducers";
import { NavigatorName } from "../const";
import { previousRouteNameRef, currentRouteNameRef } from "./screenRefs";
import { Maybe } from "../types/helpers";

let sessionId = uuid();
const appVersion = `${VersionNumber.appVersion || ""} (${
  VersionNumber.buildVersion || ""
})`;
const { ANALYTICS_LOGS, ANALYTICS_TOKEN } = Config;

export const updateSessionId = () => (sessionId = uuid());

const extraProperties = (store: AppStore) => {
  const state: State = store.getState();
  const sensitiveAnalytics = sensitiveAnalyticsSelector(state);
  const systemLanguage = sensitiveAnalytics
    ? null
    : RNLocalize.getLocales()[0]?.languageTag;
  const language = sensitiveAnalytics ? null : languageSelector(state);
  const region = sensitiveAnalytics ? null : localeSelector(state);
  const devices = knownDevicesSelector(state);
  const satisfaction = satisfactionSelector(state);
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

  return {
    appVersion,
    androidVersionCode: getAndroidVersionCode(VersionNumber.buildVersion),
    androidArchitecture: getAndroidArchitecture(VersionNumber.buildVersion),
    environment: ANALYTICS_LOGS ? "development" : "production",
    systemLanguage: sensitiveAnalytics ? null : systemLanguage,
    language,
    region: region?.split("-")[1] || region,
    platformOS: Platform.OS,
    platformVersion: Platform.Version,
    sessionId,
    devicesCount: devices.length,
    firstConnectionHasDevice,
    ...(satisfaction
      ? {
          satisfaction,
        }
      : {}),
    ...deviceInfo,
  };
};

const context = {
  ip: "0.0.0.0",
};

type MaybeAppStore = Maybe<AppStore>;

let storeInstance: MaybeAppStore; // is the redux store. it's also used as a flag to know if analytics is on or off.

const token = __DEV__ ? null : ANALYTICS_TOKEN;
export const start = async (store: AppStore) => {
  if (token) {
    await analytics.setup(token, {
      android: {
        collectDeviceId: false,
      },
      ios: {
        trackAdvertising: false,
        trackDeepLinks: false,
      },
    });
  }

  const { user, created } = await getOrCreateUser();
  storeInstance = store;

  if (ANALYTICS_LOGS) console.log("analytics:identify", user.id);

  if (created) {
    if (ANALYTICS_LOGS) console.log("analytics:identify", user.id);

    if (token) {
      await analytics.reset();
      await analytics.identify(user.id, extraProperties(store) as JsonMap, {
        context,
      });
    }
  }

  track("Start", extraProperties(store), true);
};
export const updateIdentify = async () => {
  Sentry.addBreadcrumb({
    category: "identify",
    level: "debug",
  });

  if (!storeInstance || !analyticsEnabledSelector(storeInstance.getState())) {
    return;
  }

  if (ANALYTICS_LOGS)
    console.log("analytics:identify", extraProperties(storeInstance), {
      context,
    });
  if (!token) return;
  const { user } = await getOrCreateUser();
  analytics.identify(user.id, extraProperties(storeInstance) as JsonMap, {
    context,
  });
};
export const stop = () => {
  if (ANALYTICS_LOGS) console.log("analytics:stop");
  storeInstance = null;
};
export const trackSubject = new ReplaySubject<{
  event: string;
  properties?: Error | Record<string, unknown> | null;
}>(10);
export const track = (
  event: string,
  properties?: Error | Record<string, unknown> | null,
  mandatory?: boolean | null,
) => {
  Sentry.addBreadcrumb({
    message: event,
    category: "track",
    data: properties || undefined,
    level: "debug",
  });

  const state = storeInstance && storeInstance.getState();

  const readOnlyMode = state && readOnlyModeEnabledSelector(state);
  const hasOrderedNano = state && hasOrderedNanoSelector(state);

  if (
    !state ||
    (!mandatory && !analyticsEnabledSelector(state)) ||
    (readOnlyMode && hasOrderedNano) // do not track anything in the reborn state post purchase pre device setup
  ) {
    return;
  }

  const screen = currentRouteNameRef.current;

  const allProperties = {
    screen,
    ...extraProperties(storeInstance as AppStore),
    ...properties,
  };
  if (ANALYTICS_LOGS) console.log("analytics:track", event, allProperties);
  trackSubject.next({
    event,
    properties: allProperties,
  });
  if (!token) return;
  analytics.track(event, allProperties as JsonMap, {
    context,
  });
};
export const getPageNameFromRoute = (route: RouteProp<ParamListBase>) => {
  const routeName =
    getFocusedRouteNameFromRoute(route) || NavigatorName.Portfolio;
  return snakeCase(routeName);
};
export const trackWithRoute = (
  event: string,
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
      event: string,
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
export const screen = (
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

  const readOnlyMode = state && readOnlyModeEnabledSelector(state);
  const hasOrderedNano = state && hasOrderedNanoSelector(state);

  if (
    !state ||
    !analyticsEnabledSelector(state) ||
    (readOnlyMode && hasOrderedNano) // do not track anything in the reborn state post purchase pre device setup
  ) {
    return;
  }

  const source = previousRouteNameRef.current;

  const allProperties = {
    source,
    ...extraProperties(storeInstance as AppStore),
    ...properties,
  };
  if (ANALYTICS_LOGS)
    console.log("analytics:screen", category, name, allProperties);
  trackSubject.next({
    event: title,
    properties: allProperties,
  });
  if (!token) return;
  analytics.track(title, allProperties as JsonMap, {
    context,
  });
};
