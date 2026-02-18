import { AnalyticsBrowser } from "@segment/analytics-next";
import { getTokensWithFunds } from "@ledgerhq/live-common/domain/getTokensWithFunds";
import {
  getStablecoinYieldSetting,
  getBitcoinYieldSetting,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import { runOnceWhen } from "@ledgerhq/live-common/utils/runOnceWhen";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@ledgerhq/live-env";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import type { AccountLike, Feature, FeatureId, Features } from "@ledgerhq/types-live";
import { idsToLanguage } from "@ledgerhq/types-live";
import invariant from "invariant";
import { useCallback, useContext } from "react";
import type * as Redux from "redux";
import { ReplaySubject } from "rxjs";
import { v4 as uuid } from "uuid";
import { getParsedSystemLocale } from "~/helpers/systemLocale";
import user from "~/helpers/user";
import { getVersionedRedirects } from "LLD/hooks/useVersionedStakePrograms";
import logger from "~/renderer/logger";
import type { State } from "~/renderer/reducers";
import {
  developerModeSelector,
  devicesModelListSelector,
  hasSeenAnalyticsOptInPromptSelector,
  languageSelector,
  lastSeenDeviceSelector,
  localeSelector,
  mevProtectionSelector,
  shareAnalyticsSelector,
  sharePersonalizedRecommendationsSelector,
  sidebarCollapsedSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";
import { analyticsDrawerContext } from "../drawers/Provider";
import { accountsSelector } from "../reducers/accounts";
import { currentRouteNameRef, previousRouteNameRef } from "./screenRefs";
import {
  onboardingIsSyncFlowSelector,
  onboardingReceiveFlowSelector,
  onboardingSyncFlowSelector,
} from "../reducers/onboarding";
import { hubStateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { getTotalStakeableAssets } from "@ledgerhq/live-common/domain/getTotalStakeableAssets";
import { getWallet40Attributes } from "@ledgerhq/live-common/analytics/featureFlagHelpers/wallet40";

type ReduxStore = Redux.MiddlewareAPI<Redux.Dispatch<Redux.UnknownAction>, State>;

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

let storeInstance: ReduxStore | null | undefined; // is the redux store. it's also used as a flag to know if analytics is on or off.
let analyticsInstance: AnalyticsBrowser | null = null;
let analyticsFeatureFlagMethod:
  | null
  | (<T extends FeatureId>(key: T) => Feature<Features[T]["params"]> | null);

export function setAnalyticsFeatureFlagMethod(method: typeof analyticsFeatureFlagMethod): void {
  analyticsFeatureFlagMethod = method;
}

const getLedgerSyncAttributes = (state: State) => {
  if (!analyticsFeatureFlagMethod) return false;
  const walletSync = analyticsFeatureFlagMethod("lldWalletSync");
  const ledgerSyncOptimisation = analyticsFeatureFlagMethod("lwdLedgerSyncOptimisation");

  return {
    hasLedgerSync: !!walletSync?.enabled,
    ledgerSyncActivated: !!state.trustchain.trustchain?.rootId,
    ledger_sync_revamp: !!ledgerSyncOptimisation?.enabled,
  };
};

const getMEVAttributes = (state: State) => {
  if (!analyticsFeatureFlagMethod) return false;

  const hasMEVActivated = mevProtectionSelector(state);

  return {
    MEVProtectionActivated: hasMEVActivated ? "Yes" : "No",
  };
};

const getMADAttributes = () => {
  if (!analyticsFeatureFlagMethod) return false;
  const madFeatureFlag = analyticsFeatureFlagMethod("lldModularDrawer");
  const rollout_phase = "INC2";

  const isEnabled = madFeatureFlag?.enabled ?? false;

  return {
    rollout_phase,
    isEnabled,
    add_account: madFeatureFlag?.params?.add_account ?? false,
    live_app: madFeatureFlag?.params?.live_app ?? false,
    live_apps_allowlist: madFeatureFlag?.params?.live_apps_allowlist,
    live_apps_blocklist: madFeatureFlag?.params?.live_apps_blocklist,
    receive_flow: madFeatureFlag?.params?.receive_flow ?? false,
    send_flow: madFeatureFlag?.params?.send_flow ?? false,
    isModularizationEnabled: madFeatureFlag?.params?.enableModularization ?? false,
    enableDialogDesktop: madFeatureFlag?.params?.enableDialogDesktop ?? false,
  };
};

const getAddAccountAttributes = () => {
  if (!analyticsFeatureFlagMethod) return {};
  const addAccount = analyticsFeatureFlagMethod("lldNetworkBasedAddAccount");

  const isEnabled = addAccount?.enabled ?? false;

  return {
    feature_add_account_desktop: isEnabled,
  };
};
const getPtxAttributes = () => {
  if (!analyticsFeatureFlagMethod) return {};
  const fetchAdditionalCoins = analyticsFeatureFlagMethod("fetchAdditionalCoins");
  const stakingProviders = analyticsFeatureFlagMethod("ethStakingProviders");
  const rawStakePrograms = analyticsFeatureFlagMethod("stakePrograms");
  const ptxCard = analyticsFeatureFlagMethod("ptxCard");
  const ptxSwapLiveAppOnPortfolio = analyticsFeatureFlagMethod("ptxSwapLiveAppOnPortfolio");

  const isBatch1Enabled: boolean =
    !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 1;
  const isBatch2Enabled: boolean =
    !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 2;
  const isBatch3Enabled: boolean =
    !!fetchAdditionalCoins?.enabled && fetchAdditionalCoins?.params?.batch === 3;
  const stakingProvidersEnabled: number | string =
    !!stakingProviders?.enabled &&
    stakingProviders?.params &&
    stakingProviders?.params?.listProvider?.length > 0
      ? stakingProviders?.params?.listProvider.length
      : "flag not loaded";

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
  const bitcoinYield = getBitcoinYieldSetting(stakePrograms);
  const ethDepositScreen = getEthDepositScreenSetting(stakePrograms);

  return {
    isBatch1Enabled,
    isBatch2Enabled,
    isBatch3Enabled,
    stakingProvidersEnabled,
    ptxCard: ptxCard?.enabled,
    ptxSwapLiveAppOnPortfolio: ptxSwapLiveAppOnPortfolio?.enabled,
    stablecoinYield,
    bitcoinYield,
    ethDepositScreen,
    stakingCurrenciesEnabled,
    partnerStakingCurrenciesEnabled,
  };
};

const getMandatoryProperties = (store: ReduxStore) => {
  const state = store.getState();
  const analyticsEnabled = shareAnalyticsSelector(state);
  const personalizedRecommendationsEnabled = sharePersonalizedRecommendationsSelector(state);
  const hasSeenAnalyticsOptInPrompt = hasSeenAnalyticsOptInPromptSelector(state);
  const devModeEnabled = developerModeSelector(state);

  return {
    devModeEnabled,
    optInAnalytics: analyticsEnabled,
    optInPersonalRecommendations: personalizedRecommendationsEnabled,
    hasSeenAnalyticsOptInPrompt,
  };
};

const extraProperties = (store: ReduxStore) => {
  const state: State = store.getState();
  const mandatoryProperties = getMandatoryProperties(store);
  const language = languageSelector(state);
  const region = (localeSelector(state).split("-")[1] || "").toUpperCase() || null;
  const systemLocale = getParsedSystemLocale();
  const device = lastSeenDeviceSelector(state);
  const devices = devicesModelListSelector(state);
  const accounts = accountsSelector(state);
  const { postOnboardingInProgress } = hubStateSelector(state);

  const isOnboardingReceiveFlow = onboardingReceiveFlowSelector(state);
  const isOnboardingSyncFlow = onboardingIsSyncFlowSelector(state);
  const onboardingSyncFlow = onboardingSyncFlowSelector(state);
  const isOnboardingFlow = isOnboardingReceiveFlow || isOnboardingSyncFlow;

  const ptxAttributes = getPtxAttributes();
  const ldmkTransport = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkTransport")
    : { enabled: false };
  const ldmkConnectApp = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkConnectApp")
    : { enabled: false };
  const lldSyncOnboardingIncr1 = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("lldSyncOnboardingIncr1")
    : { enabled: false };
  const ldmkSolanaSigner = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkSolanaSigner")
    : { enabled: false };
  const nanoOnboardingFundWallet = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("nanoOnboardingFundWallet")
    : { enabled: false };

  const ledgerSyncAttributes = getLedgerSyncAttributes(state);
  const mevProtectionAttributes = getMEVAttributes(state);
  const madAttributes = getMADAttributes();
  const addAccountAttributes = getAddAccountAttributes();

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

  const { combinedIds, stakeableAssets } = getTotalStakeableAssets(
    accounts,
    Array.isArray(ptxAttributes.stakingCurrenciesEnabled)
      ? ptxAttributes.stakingCurrenciesEnabled
      : [],
    Array.isArray(ptxAttributes.partnerStakingCurrenciesEnabled)
      ? ptxAttributes.partnerStakingCurrenciesEnabled
      : [],
  );
  const stakeableAssetsList = stakeableAssets.map(
    asset => `${asset.ticker} on ${asset.networkName}`,
  );

  const accountsWithFunds = accounts
    ? [
        ...new Set(
          accounts
            .filter(account => account?.balance.isGreaterThan(0))
            .map(account => account?.currency?.ticker),
        ),
      ]
    : [];

  const tokenWithFunds = getTokensWithFunds(accounts);

  const wallet40Attributes = getWallet40Attributes(analyticsFeatureFlagMethod, "lwd");

  return {
    ...mandatoryProperties,
    appVersion: __APP_VERSION__,
    language,
    appLanguage: language, // Needed for braze
    region,
    environment: process.env.SEGMENT_TEST ? "test" : __DEV__ ? "development" : "production",
    platform: "desktop",
    systemLanguage: systemLocale.language,
    systemRegion: systemLocale.region,
    osType,
    osVersion,
    sessionId,
    sidebarCollapsed,
    accountsWithFunds,
    tokenWithFunds,
    modelIdList: devices,
    ...ptxAttributes,
    ...deviceInfo,
    ...ledgerSyncAttributes,
    ...mevProtectionAttributes,
    ...addAccountAttributes,
    madAttributes,
    isLDMKTransportEnabled: ldmkTransport?.enabled,
    isLDMKConnectAppEnabled: ldmkConnectApp?.enabled,
    lldSyncOnboardingIncr1: Boolean(lldSyncOnboardingIncr1?.enabled),
    nanoOnboardingFundWallet: Boolean(nanoOnboardingFundWallet?.enabled),
    // For tracking receive flow events during onboarding
    ...(postOnboardingInProgress && !isOnboardingFlow ? { flow: "post-onboarding" } : {}),
    ...(isOnboardingFlow ? { flow: "Onboarding", ...onboardingSyncFlow } : {}),
    isLDMKSolanaSignerEnabled: ldmkSolanaSigner?.enabled,
    totalStakeableAssets: combinedIds.size,
    stakeableAssets: stakeableAssetsList,
    wallet40Attributes,
  };
};

function initializeSegment() {
  if (analyticsInstance) return;

  const writeKey = process.env.SEGMENT_WRITE_KEY || "olBQc203GA3fXVa48rJB9c3826CY1axp";

  // Initialize Segment with cdnSettings to avoid fetching settings from CDN
  analyticsInstance = AnalyticsBrowser.load({
    writeKey,
    cdnSettings: {
      integrations: {
        "Segment.io": {
          apiKey: writeKey,
          apiHost: "api.segment.io/v1",
        },
      },
    },
  });
}

function getAnalytics(): AnalyticsBrowser | null {
  return analyticsInstance;
}
export const startAnalytics = async (store: ReduxStore) => {
  if (!user || (!process.env.SEGMENT_TEST && (getEnv("MOCK") || getEnv("PLAYWRIGHT_RUN")))) return;
  // calling user() first is essential because otherwise the store data will not reflect the user's preferences
  // and hence canBeTracked will always be set to true...
  const { id } = await user();
  storeInstance = store;

  const canBeTracked = trackingEnabledSelector(store.getState());
  if (!canBeTracked) return;

  // Initialize Segment with the write key from config
  initializeSegment();

  const analytics = getAnalytics();
  if (!analytics) return;

  const allProperties = {
    ...extraProperties(store),
    userId: id,
    braze_external_id: id, // Needed for braze with this exact name
  };
  logger.analyticsStart(id, allProperties);
  analytics.identify(id, allProperties, {
    context: getContext(),
  });
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
  analytics.track(event, properties ?? undefined, {
    context: getContext(),
  });
}

const confidentialityFilter = (properties?: Record<string, unknown> | null) => {
  const { account, parentAccount } = properties || {};
  const filterAccount = account
    ? {
        account:
          typeof account === "object" ? getDefaultAccountName(account as AccountLike) : account,
      }
    : {};
  const filterParentAccount = parentAccount
    ? {
        parentAccount:
          typeof parentAccount === "object"
            ? getDefaultAccountName(parentAccount as AccountLike)
            : parentAccount,
      }
    : {};
  return {
    ...properties,
    ...filterAccount,
    ...filterParentAccount,
  };
};

export interface UpdateIdentifyOptions {
  /** When true, send identify even when both analytics opt-ins are false (e.g. after analytics prompt "Refuse all"). */
  force?: boolean;
}

export const updateIdentify = async ({ force }: UpdateIdentifyOptions = { force: false }) => {
  if (!storeInstance) return;

  const canTrack = force || trackingEnabledSelector(storeInstance.getState());
  if (!canTrack) return;

  const analytics = getAnalytics();
  if (!analytics) return;
  const { id } = await user();

  const allProperties = {
    ...extraProperties(storeInstance),
    userId: id,
    braze_external_id: id, // Needed for braze with this exact name
  };
  analytics.identify(id, allProperties, {
    context: getContext(),
  });
};
/** Ensure PTX flag attributes are set as soon as feature flags load */
runOnceWhen(() => !!analyticsFeatureFlagMethod && !!getAnalytics(), updateIdentify);

export const track = (
  eventName: string,
  properties?: Record<string, unknown> | null,
  mandatory?: boolean | null,
) => {
  if (!storeInstance || (!mandatory && !trackingEnabledSelector(storeInstance.getState()))) {
    return;
  }

  const eventPropertiesWithoutExtra = {
    page: currentRouteNameRef.current,
    ...properties,
  };

  const allProperties = {
    ...eventPropertiesWithoutExtra,
    ...(mandatory ? getMandatoryProperties(storeInstance) : extraProperties(storeInstance)),
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
  if (!storeInstance || !trackingEnabledSelector(storeInstance.getState())) {
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
