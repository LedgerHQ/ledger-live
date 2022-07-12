// @flow
/* eslint-disable no-console */

import "crypto";
import { v4 as uuid } from "uuid";
import * as Sentry from "@sentry/react-native";
import Config from "react-native-config";
import { Platform } from "react-native";
import analytics from "@segment/analytics-react-native";
import VersionNumber from "react-native-version-number";
import RNLocalize from "react-native-localize";
import { ReplaySubject } from "rxjs";
import {
  getFocusedRouteNameFromRoute,
  RouteProp,
  useRoute,
} from "@react-navigation/native";
import { snakeCase } from "lodash";
import { useCallback } from "react";
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
} from "../reducers/settings";
import { knownDevicesSelector } from "../reducers/ble";
import { satisfactionSelector } from "../reducers/ratings";
import type { State } from "../reducers";
import { NavigatorName } from "../const";

const sessionId = uuid();

const appVersion = `${VersionNumber.appVersion ||
  ""} (${VersionNumber.buildVersion || ""})`;

const { ANALYTICS_LOGS, ANALYTICS_TOKEN } = Config;

const extraProperties = store => {
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
        appLength: lastDevice?.appsInstalled,
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
    // $FlowFixMe
    ...deviceInfo,
    ...(satisfaction && { satisfaction }),
  };
};

const context = {
  ip: "0.0.0.0",
};

let storeInstance; // is the redux store. it's also used as a flag to know if analytics is on or off.

const token = __DEV__ ? null : ANALYTICS_TOKEN;

export const start = async (store: *) => {
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
  if (created) {
    if (ANALYTICS_LOGS) console.log("analytics:identify", user.id);
    if (token) {
      await analytics.reset();
      await analytics.identify(user.id, extraProperties(store), { context });
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
  analytics.identify(user.id, extraProperties(storeInstance), { context });
};

export const stop = () => {
  if (ANALYTICS_LOGS) console.log("analytics:stop");
  storeInstance = null;
};

export const trackSubject: any = new ReplaySubject<{
  event: string,
  properties: ?Object,
}>(10);

export const track = (
  event: string,
  properties: ?Object,
  mandatory: ?boolean,
) => {
  Sentry.addBreadcrumb({
    message: event,
    category: "track",
    data: properties,
    level: "debug",
  });

  if (
    !storeInstance ||
    (!mandatory && !analyticsEnabledSelector(storeInstance.getState()))
  ) {
    return;
  }

  const allProperties = {
    ...extraProperties(storeInstance),
    ...properties,
  };

  if (ANALYTICS_LOGS) console.log("analytics:track", event, allProperties);
  trackSubject.next({ event, properties: allProperties });

  if (!token) return;
  analytics.track(event, allProperties, { context });
};

export const getPageNameFromRoute = (route: RouteProp) => {
  const routeName =
    getFocusedRouteNameFromRoute(route) || NavigatorName.Portfolio;
  return snakeCase(routeName);
};

export const trackWithRoute = (
  event: string,
  properties: ?Object,
  mandatory: ?boolean,
  route: RouteProp,
) => {
  const newProperties = {
    page: getPageNameFromRoute(route), // don't override page if it's already set
    ...(properties || {}),
  };
  track(event, newProperties, mandatory);
};

export const useTrack = () => {
  const route = useRoute();
  const track = useCallback(
    (event: string, properties: ?Object, mandatory: ?boolean) =>
      trackWithRoute(event, properties, mandatory, route),
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
  return { track, page };
};

export const screen = (
  category: string,
  name: ?string,
  properties: ?Object,
) => {
  const title = `Page ${category + (name ? ` ${name}` : "")}`;
  Sentry.addBreadcrumb({
    message: title,
    category: "screen",
    data: properties,
    level: "info",
  });
  if (!storeInstance || !analyticsEnabledSelector(storeInstance.getState())) {
    return;
  }

  const allProperties = {
    ...extraProperties(storeInstance),
    ...properties,
  };

  if (ANALYTICS_LOGS)
    console.log("analytics:screen", category, name, allProperties);
  trackSubject.next({ event: title, properties: allProperties });

  if (!token) return;
  analytics.track(title, allProperties, { context });
};
