import { getTokensWithFunds } from "@ledgerhq/live-common/domain/getTokensWithFunds";
import {
  getStablecoinYieldSetting,
  getBitcoinYieldSetting,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/earn/stakePrograms/index";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getDefaultAccountName } from "@domain/entity-account-name";
import { selectContacts } from "@domain/entity-contact";
import { buildContactsGlobalProperties } from "@features/platform-contacts";
import type { AccountLike } from "@ledgerhq/types-live";
import { idsToLanguage } from "@ledgerhq/types-live";
import type { Feature, FeatureId, Features } from "@shared/feature-flags";
import type * as Redux from "redux";
import { getParsedSystemLocale } from "~/helpers/systemLocale";
import { getDistributionChannel } from "~/helpers/distributionChannel";
import { getVersionedRedirects } from "LLD/hooks/useVersionedStakePrograms";
import type { State } from "~/renderer/reducers";
import {
  analyticsConsentInfoSelector,
  developerModeSelector,
  devicesModelListSelector,
  hasCompletedOnboardingSelector,
  hasOnboardedDeviceSelector,
  hasSeenAnalyticsOptInPromptSelector,
  languageSelector,
  lastSeenDeviceSelector,
  localeSelector,
  mevProtectionSelector,
  shareAnalyticsSelector,
  sharePersonalizedRecommendationsSelector,
  sidebarCollapsedSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "../reducers/accounts";
import {
  onboardingIsSyncFlowSelector,
  onboardingReceiveFlowSelector,
  onboardingSyncFlowSelector,
} from "../reducers/onboarding";
import { getOnboardingStatusAttributes } from "./onboardingStatus";
import { hubStateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { getTotalStakeableAssets } from "@ledgerhq/live-common/domain/getTotalStakeableAssets";
import { getOnboardingCounterfeitWarningAttributes } from "@ledgerhq/live-common/analytics/featureFlagHelpers/onboardingCounterfeitWarning";
import { getWallet40Attributes } from "@ledgerhq/live-common/analytics/featureFlagHelpers/wallet40";
import { getNewSendFlowAttribute } from "@ledgerhq/live-common/analytics/featureFlagHelpers/newSendFlow";
import { getRemoteABTestingAttributes } from "@ledgerhq/live-common/analytics/remoteABTesting/remoteABTestingAnalytics";
import { scrubAccountId } from "../helpers/scrubAccountId";

type ReduxStore = Redux.MiddlewareAPI<Redux.Dispatch<Redux.UnknownAction>, State>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require("os");
const osType = os.type();
const osVersion = os.release();
const sessionId = require("uuid").v4();
let analyticsFeatureFlagMethod:
  | null
  | (<T extends FeatureId>(key: T) => Feature<Features[T]["params"]> | null);

export function setAnalyticsFeatureFlagMethod(method: typeof analyticsFeatureFlagMethod): void {
  analyticsFeatureFlagMethod = method;
}

export function hasAnalyticsFeatureFlagMethod(): boolean {
  return analyticsFeatureFlagMethod != null;
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

const getBackupHubAttributes = () => {
  if (!analyticsFeatureFlagMethod) return {};
  const backupHub = analyticsFeatureFlagMethod("lwdBackupHub");

  return {
    lwdBackupHub: !!backupHub?.enabled,
  };
};

const getProductTourAttributes = () => {
  if (!analyticsFeatureFlagMethod) return {};
  const productTour = analyticsFeatureFlagMethod("lwdProductTour");

  return {
    lwdProductTour: !!productTour?.enabled,
  };
};

const getPayTabAttributes = () => {
  if (!analyticsFeatureFlagMethod) return false;
  const payTab = analyticsFeatureFlagMethod("lwdPayTab");

  return {
    isEnabled: payTab?.enabled ?? false,
    card: payTab?.params?.card ?? false,
  };
};

const getLargeScreenUpsellAttributes = () => {
  if (!analyticsFeatureFlagMethod) return {};
  const flag = analyticsFeatureFlagMethod("largeScreenUpsell");
  const params = flag?.params;

  return {
    enabled: !!flag?.enabled,
    modalEnabled: !!params?.modal?.enabled,
    killThreshold: params?.modal?.killThreshold,
    cadenceDays: params?.modal?.cadenceDays,
    cooldownDays: params?.cooldownDays,
    discount: params?.discount,
  };
};

const getPtxAttributes = () => {
  if (!analyticsFeatureFlagMethod) return {};
  const fetchAdditionalCoins = analyticsFeatureFlagMethod("fetchAdditionalCoins");
  const stakingProviders = analyticsFeatureFlagMethod("ethStakingProviders");
  const rawStakePrograms = analyticsFeatureFlagMethod("stakePrograms");
  const ptxCard = analyticsFeatureFlagMethod("ptxCard");
  const ptxSwapLiveAppOnPortfolio = analyticsFeatureFlagMethod("ptxSwapLiveAppOnPortfolio");
  const ptxSwapLiveAppOnAsset = analyticsFeatureFlagMethod("ptxSwapLiveAppOnAsset");
  const ptxBorrowLiveApp = analyticsFeatureFlagMethod("ptxBorrowLiveApp");
  const stableSavings = analyticsFeatureFlagMethod("stableSavings");

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
    ptxSwapLiveAppOnAsset: ptxSwapLiveAppOnAsset?.enabled,
    borrowFeature: !!ptxBorrowLiveApp?.enabled,
    stableSavings: !!stableSavings?.enabled,
    stablecoinYield,
    bitcoinYield,
    ethDepositScreen,
    stakingCurrenciesEnabled,
    partnerStakingCurrenciesEnabled,
  };
};

export const getMandatoryProperties = (store: ReduxStore) => {
  const state = store.getState();
  const analyticsEnabled = shareAnalyticsSelector(state);
  const personalizedRecommendationsEnabled = sharePersonalizedRecommendationsSelector(state);
  const hasSeenAnalyticsOptInPrompt = hasSeenAnalyticsOptInPromptSelector(state);
  const devModeEnabled = developerModeSelector(state);
  const readOnlyMode = !hasOnboardedDeviceSelector(state);
  const analyticsInfo = analyticsConsentInfoSelector(state);

  return {
    devModeEnabled,
    optInAnalytics: analyticsEnabled,
    optInPersonalRecommendations: personalizedRecommendationsEnabled,
    hasSeenAnalyticsOptInPrompt,
    readOnlyMode,
    analyticsInfo,
  };
};

export const extraProperties = (store: ReduxStore) => {
  const state: State = store.getState();
  const mandatoryProperties = getMandatoryProperties(store);
  const language = languageSelector(state);
  const region = (localeSelector(state).split("-")[1] || "").toUpperCase() || null;
  const systemLocale = getParsedSystemLocale();
  const device = lastSeenDeviceSelector(state);
  const devices = devicesModelListSelector(state);
  const accounts = accountsSelector(state);
  const contactsAttributes = buildContactsGlobalProperties({
    contacts: selectContacts(state),
  });
  const contactsFeature = analyticsFeatureFlagMethod?.("lwdContacts") ?? { enabled: false };
  const { postOnboardingInProgress } = hubStateSelector(state);

  const isOnboardingReceiveFlow = onboardingReceiveFlowSelector(state);
  const isOnboardingSyncFlow = onboardingIsSyncFlowSelector(state);
  const onboardingSyncFlow = onboardingSyncFlowSelector(state);
  const isOnboardingFlow = isOnboardingReceiveFlow || isOnboardingSyncFlow;
  const readOnlyMode = !hasOnboardedDeviceSelector(state);
  const hasCompletedOnboarding = hasCompletedOnboardingSelector(state);

  const ptxAttributes = getPtxAttributes();
  const ldmkTransport = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkTransport")
    : { enabled: false };
  const ldmkConnectApp = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkConnectApp")
    : { enabled: false };
  const ldmkSolanaSigner = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkSolanaSigner")
    : { enabled: false };
  const ldmkCosmosSigner = analyticsFeatureFlagMethod
    ? analyticsFeatureFlagMethod("ldmkCosmosSigner")
    : { enabled: false };

  const ledgerSyncAttributes = getLedgerSyncAttributes(state);
  const mevProtectionAttributes = getMEVAttributes(state);
  const madAttributes = getMADAttributes();
  const addAccountAttributes = getAddAccountAttributes();
  const backupHubAttributes = getBackupHubAttributes();
  const productTourAttributes = getProductTourAttributes();
  const payTabAttributes = getPayTabAttributes();
  const largeScreenUpsellAttributes = getLargeScreenUpsellAttributes();

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
  const onboardingWidgetFlag = analyticsFeatureFlagMethod?.("onboardingWidget");
  const onboardingCounterfeitWarningAttributes = getOnboardingCounterfeitWarningAttributes(
    analyticsFeatureFlagMethod,
    "lwd",
  );
  const newSendFlow = getNewSendFlowAttribute(analyticsFeatureFlagMethod);
  const remoteABTestingAttributes = getRemoteABTestingAttributes(analyticsFeatureFlagMethod);

  return {
    ...mandatoryProperties,
    appVersion: __APP_VERSION__,
    language,
    appLanguage: language, // Needed for braze
    region,
    environment: process.env.SEGMENT_TEST ? "test" : __DEV__ ? "development" : "production",
    platform: "desktop",
    distributionChannel: getDistributionChannel(),
    systemLanguage: systemLocale.language,
    systemRegion: systemLocale.region,
    osType,
    osVersion,
    sessionId,
    sidebarCollapsed,
    accountsWithFunds,
    ContactsAttributes: contactsFeature,
    ...contactsAttributes,
    tokenWithFunds,
    modelIdList: devices,
    ...ptxAttributes,
    ...deviceInfo,
    ...ledgerSyncAttributes,
    ...mevProtectionAttributes,
    ...addAccountAttributes,
    ...backupHubAttributes,
    ...productTourAttributes,
    largeScreenUpsellAttributes,
    madAttributes,
    isLDMKTransportEnabled: ldmkTransport?.enabled,
    isLDMKConnectAppEnabled: ldmkConnectApp?.enabled,
    // For tracking receive flow events during onboarding
    ...getOnboardingStatusAttributes(
      postOnboardingInProgress,
      isOnboardingFlow,
      onboardingSyncFlow,
      readOnlyMode,
      hasCompletedOnboarding,
    ),
    isLDMKSolanaSignerEnabled: ldmkSolanaSigner?.enabled,
    isLDMKCosmosSignerEnabled: ldmkCosmosSigner?.enabled,
    totalStakeableAssets: combinedIds.size,
    stakeableAssets: stakeableAssetsList,
    wallet40Attributes,
    payTabAttributes,
    finishOnboardingWidget: onboardingWidgetFlag?.enabled,
    ...onboardingCounterfeitWarningAttributes,
    newSendFlow,
    ...remoteABTestingAttributes,
  };
};

export const confidentialityFilter = (properties?: Record<string, unknown> | null) => {
  const { account, parentAccount, page, source } = properties || {};
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

  const filterPage = page
    ? {
        page: typeof page === "string" ? scrubAccountId(page) : page,
      }
    : {};

  const filterSource = source
    ? {
        source: typeof source === "string" ? scrubAccountId(source) : source,
      }
    : {};

  return {
    ...properties,
    ...filterAccount,
    ...filterParentAccount,
    ...filterPage,
    ...filterSource,
  };
};
