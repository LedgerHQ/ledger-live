/* eslint-disable no-console */
import "crypto";
import { v4 as uuid } from "uuid";
import * as Sentry from "@sentry/react-native";
import Config from "react-native-config";
import { Platform } from "react-native";
import { createClient, SegmentClient, UserTraits } from "@segment/analytics-react-native";
import VersionNumber from "react-native-version-number";
import RNLocalize from "react-native-localize";
import { ReplaySubject } from "rxjs";
import {
  getFocusedRouteNameFromRoute,
  ParamListBase,
  RouteProp,
  useRoute,
} from "@react-navigation/native";
import snakeCase from "lodash/snakeCase";
import React, { MutableRefObject, useCallback } from "react";
import { ABTestingVariants, FeatureId, Features, idsToLanguage } from "@ledgerhq/types-live";
import {
  hasNftInAccounts,
  GENESIS_PASS_COLLECTION_CONTRACT,
  INFINITY_PASS_COLLECTION_CONTRACT,
} from "@ledgerhq/live-nft";
import { runOnceWhen } from "@ledgerhq/live-common/utils/runOnceWhen";
import { getStablecoinYieldSetting } from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import { getTokensWithFunds } from "@ledgerhq/live-common/domain/getTokensWithFunds";
import { getEnv } from "@ledgerhq/live-env";
import { getAndroidArchitecture, getAndroidVersionCode } from "../logic/cleanBuildVersion";
import { getIsNotifEnabled } from "../logic/getNotifPermissions";
import getOrCreateUser from "../user";
import {
  analyticsEnabledSelector,
  trackingEnabledSelector,
  languageSelector,
  localeSelector,
  sensitiveAnalyticsSelector,
  onboardingHasDeviceSelector,
  notificationsSelector,
  knownDeviceModelIdsSelector,
  customImageTypeSelector,
  userNpsSelector,
  personalizedRecommendationsEnabledSelector,
  hasSeenAnalyticsOptInPromptSelector,
  mevProtectionSelector,
  seenDevicesSelector,
  isRebornSelector,
} from "../reducers/settings";
import { bleDevicesSelector } from "../reducers/ble";
import { DeviceLike, State } from "../reducers/types";
import { satisfactionSelector } from "../reducers/ratings";
import { accountsSelector } from "../reducers/accounts";
import type { AppStore } from "../reducers";
import { NavigatorName } from "~/const";
import { previousRouteNameRef, currentRouteNameRef } from "./screenRefs";
import { AnonymousIpPlugin } from "./AnonymousIpPlugin";
import { UserIdPlugin } from "./UserIdPlugin";
import { BrazePlugin } from "./BrazePlugin";
import { Maybe } from "../types/helpers";
import { appStartupTime } from "../StartupTimeMarker";
import { aggregateData, getUniqueModelIdList } from "../logic/modelIdList";
import { getMigrationUserProps } from "LLM/storage/utils/migrations/analytics";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getVersionedRedirects } from "LLM/hooks/useStake/useVersionedStakePrograms";

let sessionId = uuid();
const appVersion = `${VersionNumber.appVersion || ""} (${VersionNumber.buildVersion || ""})`;
const { ANALYTICS_LOGS, ANALYTICS_TOKEN } = Config;

type MaybeAppStore = Maybe<AppStore>;

let storeInstance: MaybeAppStore; // is the redux store. it's also used as a flag to know if analytics is on or off.
let segmentClient: SegmentClient | undefined;
let analyticsFeatureFlagMethod: null | (<T extends FeatureId>(key: T) => Features[T] | null);

export function setAnalyticsFeatureFlagMethod(method: typeof analyticsFeatureFlagMethod): void {
  analyticsFeatureFlagMethod = method;
}

const getFeatureFlagProperties = () => {
  if (!analyticsFeatureFlagMethod || !segmentClient) return {};
  (async () => {
    const fetchAdditionalCoins = analyticsFeatureFlagMethod("fetchAdditionalCoins");
    const stakingProviders = analyticsFeatureFlagMethod("ethStakingProviders");
    const rawStakePrograms = analyticsFeatureFlagMethod("stakePrograms");
    const ptxCard = analyticsFeatureFlagMethod("ptxCard");

    const ptxSwapLiveAppMobileFlag = analyticsFeatureFlagMethod("ptxSwapLiveAppMobile");
    const ptxSwapLiveAppKycWarning = analyticsFeatureFlagMethod("ptxSwapLiveAppKycWarning");

    const isBatch1Enabled =
      !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 1;
    const isBatch2Enabled =
      !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 2;
    const isBatch3Enabled =
      !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 3;
    const stakingProvidersEnabled =
      stakingProviders?.enabled && stakingProviders?.params?.listProvider.length;

    const ptxSwapLiveAppMobileEnabled = Boolean(ptxSwapLiveAppMobileFlag?.enabled);
    const ptxSwapLiveAppKycWarningEnabled = Boolean(ptxSwapLiveAppKycWarning?.enabled);

    // Apply versioned redirects logic to the stakePrograms feature flag
    const appVersion = LiveConfig.instance.appVersion || "0.0.0";
    const stakePrograms = rawStakePrograms
      ? getVersionedRedirects(rawStakePrograms, appVersion)
      : null;

    const stakingCurrenciesEnabled: string[] | string =
      stakePrograms?.enabled && stakePrograms?.params?.list?.length
        ? stakePrograms.params.list
        : "flag not loaded";
    const partnerStakingCurrenciesEnabled: string[] | string =
      stakePrograms?.enabled && stakePrograms?.params?.redirects
        ? Object.keys(stakePrograms.params.redirects)
        : "flag not loaded";

    const stablecoinYield = getStablecoinYieldSetting(stakePrograms);

    updateIdentify({
      isBatch1Enabled,
      isBatch2Enabled,
      isBatch3Enabled,
      stakingProvidersEnabled,
      ptxCard: ptxCard?.enabled,
      stablecoinYield,
      stakingCurrenciesEnabled,
      partnerStakingCurrenciesEnabled,
      ptxSwapLiveAppMobileEnabled,
      ptxSwapLiveAppKycWarningEnabled,
    });
  })();
};

runOnceWhen(() => !!analyticsFeatureFlagMethod && !!segmentClient, getFeatureFlagProperties);

export const updateSessionId = () => (sessionId = uuid());

const getLedgerSyncAttributes = (state: State) => {
  if (!analyticsFeatureFlagMethod) return false;
  const ledgerSync = analyticsFeatureFlagMethod("llmWalletSync");

  return {
    hasLedgerSync: !!ledgerSync?.enabled,
    ledgerSyncActivated: !!state.trustchain.trustchain?.rootId,
  };
};

const getRebornAttributes = () => {
  if (!analyticsFeatureFlagMethod) return false;
  const reborn = analyticsFeatureFlagMethod("llmRebornLP");
  const isFFEnabled = reborn?.enabled;

  return {
    llmRebornLP_A: isFFEnabled ? reborn?.params?.variant === ABTestingVariants.variantA : false,
    llmRebornLP_B: isFFEnabled ? reborn?.params?.variant === ABTestingVariants.variantB : false,
  };
};

const getMEVAttributes = (state: State) => {
  if (!analyticsFeatureFlagMethod) return false;
  const mevProtection = analyticsFeatureFlagMethod("llMevProtection");

  const hasMEVActivated = mevProtectionSelector(state);

  return {
    MEVProtectionActivated: !mevProtection?.enabled ? "Null" : hasMEVActivated ? "Yes" : "No",
  };
};

const getMandatoryProperties = async (store: AppStore) => {
  const state: State = store.getState();
  const { user } = await getOrCreateUser();
  const analyticsEnabled = analyticsEnabledSelector(state);
  const personalizedRecommendationsEnabled = personalizedRecommendationsEnabledSelector(state);
  const hasSeenAnalyticsOptInPrompt = hasSeenAnalyticsOptInPromptSelector(state);
  const devModeEnabled = getEnv("MANAGER_DEV_MODE");

  return {
    userId: user?.id,
    braze_external_id: user?.id, // Needed for braze with this exact name
    devModeEnabled,
    optInAnalytics: analyticsEnabled,
    optInPersonalRecommendations: personalizedRecommendationsEnabled,
    hasSeenAnalyticsOptInPrompt,
  };
};

const extraProperties = async (store: AppStore) => {
  const state: State = store.getState();
  const mandatoryProperties = await getMandatoryProperties(store);
  const sensitiveAnalytics = sensitiveAnalyticsSelector(state);
  const systemLanguage = sensitiveAnalytics ? null : RNLocalize.getLocales()[0]?.languageTag;
  const knownDeviceModelIds = knownDeviceModelIdsSelector(state);
  const customImageType = customImageTypeSelector(state);
  const language = sensitiveAnalytics ? null : languageSelector(state);
  const region = sensitiveAnalytics ? null : localeSelector(state);
  const devices = seenDevicesSelector(state);
  const bleDevices = bleDevicesSelector(state);
  const satisfaction = satisfactionSelector(state);
  const accounts = accountsSelector(state);
  const lastDevice = devices.at(-1) || bleDevices.at(-1);
  const ldmkTransport = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkTransport")
    : { enabled: false };
  const ldmkConnectApp = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkConnectApp")
    : { enabled: false };
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

  const onboardingHasDevice = onboardingHasDeviceSelector(state);
  const isReborn = isRebornSelector(state);

  const notifications = notificationsSelector(state);
  const hasEnabledOsNotifications = await getIsNotifEnabled();

  const notificationsOptedIn = {
    notificationsAllowed: notifications.areNotificationsAllowed,
    optInAnnouncements: notifications.announcementsCategory,
    optInLargeMovers: notifications.largeMoverCategory,
    optInTxAlerts: notifications.transactionsAlertsCategory,
    hasEnabledOsNotifications,
  };
  const notificationsBlacklisted = Object.entries(notifications)
    .filter(([key, value]) => key !== "areNotificationsAllowed" && value === false)
    .map(([key]) => key);
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
  const nps = userNpsSelector(state);

  const stakingProviders =
    analyticsFeatureFlagMethod && analyticsFeatureFlagMethod("ethStakingProviders");
  const stakingProvidersCount =
    stakingProviders?.enabled && stakingProviders?.params?.listProvider.length;

  const stakePrograms = analyticsFeatureFlagMethod && analyticsFeatureFlagMethod("stakePrograms");
  const stakingCurrenciesEnabled =
    stakePrograms?.enabled && stakePrograms?.params?.list?.length ? stakePrograms.params.list : [];
  const partnerStakingCurrenciesEnabled =
    stakePrograms?.enabled && stakePrograms?.params?.redirects
      ? Object.keys(stakePrograms.params.redirects)
      : [];

  const stablecoinYield = getStablecoinYieldSetting(stakePrograms);
  const ledgerSyncAtributes = getLedgerSyncAttributes(state);
  const rebornAttributes = getRebornAttributes();
  const mevProtectionAttributes = getMEVAttributes(state);
  const tokenWithFunds = getTokensWithFunds(accounts);
  const migrationToMMKV = getMigrationUserProps();

  // NOTE: Currently there no reliable way to uniquely identify devices from DeviceModelInfo.
  // So device counts is approximated as follows:
  // Each model of device seen which was not connected in Bluetooth is counted as a 1 device.
  const seenBleModels = bleDevices.map(d => d.modelId);
  const usbDeviceModelSeen = devices.filter(d => !seenBleModels.includes(d.modelId));
  const devicesCount = bleDevices.length + usbDeviceModelSeen.length;
  const modelIdQtyList = { ...aggregateData(bleDevices), ...aggregateData(usbDeviceModelSeen) };

  return {
    ...mandatoryProperties,
    appVersion,
    androidVersionCode: getAndroidVersionCode(VersionNumber.buildVersion),
    androidArchitecture: getAndroidArchitecture(VersionNumber.buildVersion),
    environment: ANALYTICS_LOGS ? "development" : "production",
    platform: "mobile",
    systemLanguage: sensitiveAnalytics ? null : systemLanguage,
    language,
    appLanguage: language, // In Braze it can't be called language
    region: region?.split("-")[1] || region,
    platformOS: Platform.OS,
    platformVersion: Platform.Version,
    sessionId,
    devicesCount,
    modelIdQtyList,
    modelIdList: getUniqueModelIdList(devices),
    isReborn,
    onboardingHasDevice,
    ...(satisfaction
      ? {
          satisfaction,
        }
      : {}),
    ...deviceInfo,
    notificationsBlacklisted,
    ...notificationsOptedIn,
    accountsWithFunds,
    blockchainsWithNftsOwned,
    hasGenesisPass,
    hasInfinityPass,
    appTimeToInteractiveMilliseconds: appStartupTime,
    staxDeviceUser: knownDeviceModelIds.stax,
    staxLockscreen: customImageType || "none",
    nps,
    stakingProvidersEnabled: stakingProvidersCount || "flag not loaded",
    stablecoinYield,
    ...ledgerSyncAtributes,
    ...rebornAttributes,
    ...mevProtectionAttributes,
    migrationToMMKV,
    tokenWithFunds,
    isLDMKTransportEnabled: ldmkTransport?.enabled,
    isLDMKConnectAppEnabled: ldmkConnectApp?.enabled,
    stakingCurrenciesEnabled,
    partnerStakingCurrenciesEnabled,
  };
};

const token = ANALYTICS_TOKEN;
export const start = async (store: AppStore): Promise<SegmentClient | undefined> => {
  const { user, created } = await getOrCreateUser();
  storeInstance = store;

  if (created && ANALYTICS_LOGS) {
    console.log("analytics:identify", user.id);
  }

  console.log("START ANALYTICS", ANALYTICS_LOGS);
  if (token) {
    segmentClient = createClient({
      writeKey: token,
      debug: !!ANALYTICS_LOGS,
    });
    // This allows us to not retrieve users ip addresses for privacy reasons
    segmentClient.add({ plugin: new AnonymousIpPlugin() });
    // This allows us to make sure we are adding the userId to the event
    segmentClient.add({ plugin: new UserIdPlugin() });
    // This allows us to debounce identify events for Braze and save data points
    segmentClient.add({ plugin: new BrazePlugin() });

    if (created) {
      segmentClient.reset();
    }
    await updateIdentify();
  }
  await track("Start");

  return segmentClient;
};

export const updateIdentify = async (additionalProperties?: UserTraits, mandatory?: boolean) => {
  Sentry.addBreadcrumb({
    category: "identify",
    level: "debug",
  });

  const state = storeInstance && storeInstance.getState();
  const isTracking = getIsTracking(state, mandatory);
  if (!storeInstance || !isTracking.enabled) {
    return;
  }

  const userExtraProperties = await extraProperties(storeInstance);
  const mandatoryProperties = await getMandatoryProperties(storeInstance);
  const allProperties = {
    ...(mandatory ? mandatoryProperties : userExtraProperties),
    ...(additionalProperties || {}),
  };
  if (ANALYTICS_LOGS) console.log("analytics:identify", allProperties);
  if (!token) return;
  await segmentClient?.identify(userExtraProperties.userId, allProperties);
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
  const trackingEnabled = state && trackingEnabledSelector(state);

  if (!mandatory && !trackingEnabled) {
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
    if (ANALYTICS_LOGS) console.log("analytics:track: not tracking because: ", isTracking.reason);
    return;
  }

  const page = currentRouteNameRef.current;

  const userExtraProperties = await extraProperties(storeInstance as AppStore);
  const mandatoryProperties = await getMandatoryProperties(storeInstance as AppStore);
  const propertiesWithoutExtra = {
    page,
    ...eventProperties,
  };
  const allProperties = {
    ...propertiesWithoutExtra,
    ...(mandatory ? mandatoryProperties : userExtraProperties),
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
  const routeName = getFocusedRouteNameFromRoute(route) || NavigatorName.Portfolio;
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

export const flush = () => {
  segmentClient?.flush();
};

export const useTrack = () => {
  const route = useRoute();
  const track = useCallback(
    (event: EventType, properties?: Record<string, unknown> | null, mandatory?: boolean | null) =>
      trackWithRoute(event, route, properties, mandatory),
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

const lastScreenEventName: MutableRefObject<string | null | undefined> = React.createRef();

/**
 * Track an event which will have the name `Page ${category}${name ? " " + name : ""}`.
 * Extra logic to update the route names used in "screen" and "source"
 * properties of further events can be optionally enabled with the parameters
 * `updateRoutes` and `refreshSource`.
 */
export const screen = async (
  /**
   * First part of the event name string
   */
  category?: string,
  /**
   * Second part of the event name string, will be concatenated to `category`
   * after a whitespace if defined.
   */
  name?: string | null,
  /**
   * Event properties
   */
  properties?: Record<string, unknown> | null | undefined,
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
  /**
   * When true, event will not be emitted if it's a duplicate (if the last
   * screen event emitted was the same screen event).
   * This is practical in case a TrackScreen component gets remounted.
   */
  avoidDuplicates?: boolean,
  /**
   * When true, we force the tracking for this event.
   */
  mandatory?: boolean,
) => {
  const fullScreenName = (category || "") + (category && name ? " " : "") + (name || "");
  const eventName = `Page ${fullScreenName}`;
  if (avoidDuplicates && eventName === lastScreenEventName.current) return;
  lastScreenEventName.current = eventName;
  if (updateRoutes) {
    previousRouteNameRef.current = currentRouteNameRef.current;
    if (refreshSource) {
      currentRouteNameRef.current = fullScreenName;
    }
  }
  Sentry.addBreadcrumb({
    message: eventName,
    category: "screen",
    data: properties || {},
    level: "info",
  });

  const state = storeInstance && storeInstance.getState();

  const isTracking = getIsTracking(state, mandatory);
  if (!isTracking.enabled) {
    if (ANALYTICS_LOGS) console.log("analytics:screen: not tracking because: ", isTracking.reason);
    return;
  }

  const source = previousRouteNameRef.current;

  const userExtraProperties = await extraProperties(storeInstance as AppStore);
  const mandatoryProperties = await getMandatoryProperties(storeInstance as AppStore);
  const eventPropertiesWithoutExtra = {
    source,
    ...properties,
  };
  const allProperties = {
    ...eventPropertiesWithoutExtra,
    ...(mandatory ? mandatoryProperties : userExtraProperties),
  };
  if (ANALYTICS_LOGS) console.log("analytics:screen", category, name, allProperties);
  trackSubject.next({
    eventName,
    eventProperties: allProperties,
    eventPropertiesWithoutExtra,
    date: new Date(),
  });
  if (!token) return;
  segmentClient?.track(eventName, allProperties);
};
