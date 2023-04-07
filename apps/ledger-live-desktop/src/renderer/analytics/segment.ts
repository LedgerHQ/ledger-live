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
import { idsToLanguage } from "@ledgerhq/types-live";
invariant(typeof window !== "undefined", "analytics/segment must be called on renderer thread");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require("os");
const osType = os.type();
const osVersion = os.release();
const sessionId = uuid();
const getContext = _store => ({
  ip: "0.0.0.0",
  page: {
    path: "/",
    referrer: "",
    search: "",
    title: "Ledger Live",
    url: "",
  },
});
const extraProperties = store => {
  const state: State = store.getState();
  const language = languageSelector(state);
  const region = (localeSelector(state).split("-")[1] || "").toUpperCase() || null;
  const systemLocale = getParsedSystemLocale();
  const device = lastSeenDeviceSelector(state);
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
    ...deviceInfo,
  };
};
let storeInstance; // is the redux store. it's also used as a flag to know if analytics is on or off.

function getAnalytics() {
  const { analytics } = window;
  if (typeof analytics === "undefined") {
    logger.critical(new Error("window.analytics must not be undefined!"));
  }
  return analytics;
}
export const start = async (store: any) => {
  if (!user || (!process.env.SEGMENT_TEST && (getEnv("MOCK") || getEnv("PLAYWRIGHT_RUN")))) return;
  const { id } = await user();
  storeInstance = store;
  const analytics = getAnalytics();
  if (!analytics) return;
  logger.analyticsStart(id, extraProperties(store));
  analytics.identify(id, extraProperties(store), {
    context: getContext(store),
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
function sendTrack(event, properties: object | undefined | null, storeInstance: any) {
  const analytics = getAnalytics();
  if (!analytics) return;
  analytics.track(event, properties, {
    context: getContext(storeInstance),
  });
  trackSubject.next({
    event,
    properties,
  });
}
export const track = (event: string, properties?: object | null, mandatory?: boolean | null) => {
  if (!storeInstance || (!mandatory && !shareAnalyticsSelector(storeInstance.getState()))) {
    return;
  }
  const fullProperties = {
    ...extraProperties(storeInstance),
    ...properties,
  };
  logger.analyticsTrack(event, fullProperties);
  sendTrack(event, fullProperties, storeInstance);
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
  sendTrack(`Page ${category + (name ? ` ${name}` : "")}`, fullProperties, storeInstance);
};
