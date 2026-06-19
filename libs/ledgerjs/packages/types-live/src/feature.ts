// Legacy Ledger Live feature-flag types. The registry now lives in `@shared/feature-flags`
// (each export below points to its replacement). Retained as published surface only; slated
// for removal in a future `@ledgerhq/types-live` major.
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ABTestingVariants } from "./ABTesting";
import { ChainwatchNetwork } from "./chainwatch";
import { LldNanoSUpsellBannersConfig, LlmNanoSUpsellBannersConfig } from "./lnsUpsell";
import { StorylyInstanceID, StorylyInstanceType } from "./storyly";
import { WalletSyncEnvironment, WalletSyncWatchConfig } from "./walletSync";

/**
 * Feature type.
 *
 * @dev We use objects instead of direct booleans for potential future improvements.
 * @deprecated Moved to `@shared/feature-flags`. Use `Feature` from `@shared/feature-flags` instead.
 */
export type Feature<T = unknown> = {
  /**
   *  If false, the feature is disabled (for every languages regardless of the languages_whitelisted option)
   */
  enabled: boolean;

  /**
   * The `desktop_version` option is desktop specific, it has no impact on mobile
   * If set, the feature is disabled when the desktop app version does not satisfies this param
   * It should respect the semantic versioning specification (https://semver.org/)
   */
  desktop_version?: string;

  /**
   * The `mobile_version` option is mobile specific, it has no impact on mobile
   * If set, the feature is disabled when the mobile app version does not satisfies this param
   * It should respect the semantic versioning specification (https://semver.org/)
   */
  mobile_version?: string;

  /**
   *  Whether the remote value of `enabled` was overriden due to `desktop_version` or `mobile_version`
   */
  enabledOverriddenForCurrentVersion?: boolean;

  /**
   * You can optionnally use one of the two following options (languages_whitelisted and languages_blacklisted) (Only implemented on mobile for now)
   * List of languages for which the feature is enabled (it will be disabled by default for all of the others)
   */
  languages_whitelisted?: string[];

  /**
   * List of languages for which the feature is disabled
   */
  languages_blacklisted?: string[];

  /**
   * Whether the remote value of `enabled` was overriden due to `languages_whitelisted` or `languages_blacklisted`
   */
  enabledOverriddenForCurrentLanguage?: boolean;

  /**
   * Whether the remote value of this object was overriden locally
   */
  overridesRemote?: boolean;

  /**
   *  Whether the remote value of this object was overriden by an environment variable
   */
  overriddenByEnv?: boolean;

  /**
   * Additional params
   */
  params?: T;
};

/**
 * Default Feature type.
 * @deprecated Moved to `@shared/feature-flags`. Use `Feature` from `@shared/feature-flags` instead.
 */
export type DefaultFeature = Feature<unknown>;

/**
 * Currency Features type.
 * @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`.
 */
export type CurrencyFeatures = {
  currencyAvalancheCChain: DefaultFeature;
  currencyAvalancheCChainFuji: DefaultFeature;
  currencyStacks: DefaultFeature;
  currencyOptimism: DefaultFeature;
  currencyOptimismSepolia: DefaultFeature;
  currencyArbitrum: DefaultFeature;
  currencyArbitrumSepolia: DefaultFeature;
  currencyRsk: DefaultFeature;
  currencyBittorrent: DefaultFeature;
  currencyEnergyWeb: DefaultFeature;
  currencyAstar: DefaultFeature;
  currencyMetis: DefaultFeature;
  currencyMantle: DefaultFeature;
  currencyMantleSepolia: DefaultFeature;
  currencyBoba: DefaultFeature;
  currencyMoonriver: DefaultFeature;
  currencyVelasEvm: DefaultFeature;
  currencySyscoin: DefaultFeature;
  currencyAptos: DefaultFeature;
  currencyAptosTestnet: DefaultFeature;
  currencyAxelar: DefaultFeature;
  currencySecretNetwork: DefaultFeature;
  currencyDesmos: DefaultFeature;
  currencyDydx: DefaultFeature;
  currencyUmee: DefaultFeature;
  currencyStargaze: DefaultFeature;
  currencyPersistence: DefaultFeature;
  currencyQuicksilver: DefaultFeature;
  currencyInternetComputer: DefaultFeature;
  currencyInjective: DefaultFeature;
  currencyTelosEvm: DefaultFeature;
  currencyCoreum: DefaultFeature;
  currencyPolygonAmoy: DefaultFeature;
  currencyPolygonZkEvm: DefaultFeature;
  currencyPolygonZkEvmTestnet: DefaultFeature;
  currencyBase: DefaultFeature;
  currencyBaseSepolia: DefaultFeature;
  currencyBitlayer: DefaultFeature;
  currencyKlaytn: DefaultFeature;
  currencyKlaytnBaobab: DefaultFeature;
  currencyVechain: DefaultFeature;
  currencyCasper: DefaultFeature;
  currencyNeonEvm: DefaultFeature;
  currencyLukso: DefaultFeature;
  currencyLinea: DefaultFeature;
  currencyLineaSepolia: DefaultFeature;
  currencyBlast: DefaultFeature;
  currencyBlastSepolia: DefaultFeature;
  currencyScroll: DefaultFeature;
  currencyScrollSepolia: DefaultFeature;
  currencyShape: DefaultFeature;
  currencyStory: DefaultFeature;
  currencyIcon: DefaultFeature;
  currencyTon: DefaultFeature;
  currencyEtherlink: DefaultFeature;
  currencyZkSync: DefaultFeature;
  currencyZkSyncSepolia: DefaultFeature;
  currencyMantra: DefaultFeature;
  currencyXion: DefaultFeature;
  currencyZenrock: DefaultFeature;
  currencySonic: DefaultFeature;
  currencySui: DefaultFeature;
  currencySuiTestnet: DefaultFeature;
  currencyMina: DefaultFeature;
  currencyBabylon: DefaultFeature;
  currencySeiNetworkEvm: DefaultFeature;
  currencyBerachain: DefaultFeature;
  currencyHyperevm: DefaultFeature;
  currencyCantonNetwork: DefaultFeature;
  currencyCantonNetworkDevnet: DefaultFeature;
  currencyCantonNetworkTestnet: DefaultFeature;
  currencyKaspa: DefaultFeature;
  currencyEthereumHoodi: DefaultFeature;
  currencyCore: DefaultFeature;
  currencyWestend: DefaultFeature;
  currencyAssetHubWestend: DefaultFeature;
  currencyAssetHubPolkadot: DefaultFeature;
  currencyPolkadot: DefaultFeature;
  currencyMonad: DefaultFeature;
  currencyMonadTestnet: DefaultFeature;
  currencySomnia: DefaultFeature;
  currencyZeroGravity: DefaultFeature;
  currencyConcordium: DefaultFeature;
  currencyConcordiumTestnet: DefaultFeature;
  currencyAdi: DefaultFeature;
  currencyAleo: DefaultFeature;
  currencyAleoTestnet: DefaultFeature;
  currencyUnichain: DefaultFeature;
  currencyUnichainSepolia: DefaultFeature;
  currencyArc: DefaultFeature;
  currencyArcTestnet: DefaultFeature;
  currencyRobinhood: DefaultFeature;
  currencyRobinhoodTestnet: DefaultFeature;
};

/**
 * Features type.
 *
 * @dev Add features here.
 * @deprecated Moved to `@shared/feature-flags`. Use `Features` from `@shared/feature-flags` instead.
 */
export type Features = CurrencyFeatures & {
  nanoOnboardingFundWallet: DefaultFeature;
  mixpanelAnalytics: DefaultFeature;
  brazePushNotifications: Feature_BrazePushNotifications;
  ratingsPrompt: Feature_RatingsPrompt;
  npsRatingsPrompt: Feature_NpsRatingsPrompt;
  counterValue: Feature_CounterValue;
  deviceInitialApps: Feature_DeviceInitialApps;
  buyDeviceFromLive: Feature_BuyDeviceFromLive;
  mockFeature: Feature_MockFeature;
  buySellUi: Feature_BuySellUiManifest;
  buySellLoader: Feature_BuySellLoader;
  buySellShortcut: DefaultFeature;
  referralProgramDesktopSidebar: Feature_ReferralProgramDesktopSidebar;
  disableNftSend: Feature_DisableNftSend;
  disableNftLedgerMarket: Feature_DisableNftLedgerMarket;
  disableNftRaribleOpensea: Feature_DisableNftRaribleOpensea;
  receiveStakingFlowConfigDesktop: Feature_ReceiveStakingFlowConfigDesktop;
  ethStakingModalWithFilters: DefaultFeature;
  ethStakingProviders: Feature_EthStakingProviders;
  storyly: Feature_Storyly;
  firebaseEnvironmentReadOnly: Feature_FirebaseEnvironmentReadOnly;
  protectServicesMobile: Feature_ProtectServicesMobile;
  protectServicesDesktop: Feature_ProtectServicesDesktop;
  recoverUpsellPostOnboarding: Feature_RecoverUpsellPostOnboarding;
  ptxServiceCtaExchangeDrawer: Feature_PtxServiceCtaExchangeDrawer;
  ptxServiceCtaScreens: Feature_PtxServiceCtaScreens;
  swapWalletApiPartnerList: Feature_SwapWalletApiPartnerList;
  stakePrograms: Feature_StakePrograms;
  portfolioExchangeBanner: Feature_PortfolioExchangeBanner;
  editEvmTx: Feature_EditEvmTx;
  evmNativeStaking: Feature_EvmNativeStaking;
  editBitcoinTx: Feature_EditBitcoinTx;
  stakeAccountBanner: Feature_StakeAccountBanner;
  newsfeedPage: Feature_NewsfeedPage;
  domainInputResolution: Feature_DomainInputResolution;
  discover: Feature_Discover;
  transactionsAlerts: Feature_TransactionsAlerts;
  fetchAdditionalCoins: Feature_FetchAdditionalCoins;
  ptxCard: DefaultFeature;
  ptxSwapLiveAppMobile: Feature_PtxSwapLiveApp;
  ptxSwapLiveAppKycWarning: DefaultFeature;
  ptxSwapLiveApp: Feature_PtxSwapLiveApp;
  ptxPerpsLiveApp: Feature_PtxPerpsLiveApp;
  ptxPerpsLiveAppMobile: Feature_PtxPerpsLiveApp;
  ptxSwapLiveAppOnPortfolio: DefaultFeature;
  ptxSwapDetailedView: Feature_PtxSwapDetailedView;
  ptxBorrowLiveApp: Feature_PtxBorrowLiveApp;
  ptxEarnLiveApp: Feature_PtxEarnLiveApp;
  ptxEarnDrawerConfiguration: Feature_PtxEarnDrawerConfiguration;
  ptxEarnUi: Feature_PtxEarnUi;
  ptxSwapReceiveTRC20WithoutTrx: Feature_PtxSwapReceiveTRC20WithoutTrx;
  flexibleContentCards: Feature_FlexibleContentCards;
  analyticsOptIn: DefaultFeature;
  ptxSwapMoonpayProvider: Feature_PtxSwapMoonpayProvider;
  ptxSwapExodusProvider: Feature_PtxSwapExodusProvider;
  lldAnalyticsOptInPrompt: Feature_LldAnalyticsOptInPrompt;
  lldChatbotSupport: Feature_LldChatbotSupport;
  llmChatbotSupport: Feature_LlmChatbotSupport;
  myLedgerDisplayAppDeveloperName: Feature_MyLedgerDisplayAppDeveloperName;
  lldActionCarousel: Feature_lldActionCarousel;
  lldRefreshMarketData: Feature_LldRefreshMarketData;
  llmRefreshMarketData: Feature_LlmRefreshMarketData;
  lldWalletSync: Feature_LldWalletSync;
  llmWalletSync: Feature_LlmWalletSync;
  enableAppsBackup: Feature_EnableAppsBackup;
  web3hub: Feature_web3hub;
  llmMemoTag: Feature_MemoTag;
  lldMemoTag: Feature_MemoTag;
  ldmkTransport: Feature_LdmkTransport;
  llCounterValueGranularitiesRates: Feature_LlCounterValueGranularitiesRates;
  llmRebornLP: Feature_LlmRebornLP;
  llmAccountListUI: DefaultFeature;
  llmLedgerSyncEntryPoints: Feature_LlmLedgerSyncEntryPoints;
  lldLedgerSyncEntryPoints: Feature_LldLedgerSyncEntryPoints;
  lwmLedgerSyncOptimisation: DefaultFeature;
  lwdLedgerSyncOptimisation: DefaultFeature;
  lwdProductTour: DefaultFeature;
  lwdBackupHub: DefaultFeature;
  lwmNewWordingOptInNotificationsDrawer: Feature_LwmNewWordingOptInNotificationsDrawer;
  lldNanoSUpsellBanners: Feature_LldNanoSUpsellBanners;
  llmNanoSUpsellBanners: Feature_LlmNanoSUpsellBanners;
  llmThai: DefaultFeature;
  lldThai: DefaultFeature;
  llmMmkvMigration: Feature_LlmMmkvMigration;
  lldModularDrawer: Feature_ModularDrawer;
  lwdDeeplinkOpenHardening: DefaultFeature;
  lwmDeeplinkOpenHardening: DefaultFeature;
  lldWebviewManifestDomainCheck: DefaultFeature;
  llmWebviewManifestDomainCheck: DefaultFeature;
  llmModularDrawer: Feature_ModularDrawer;
  llNftEntryPoint: Feature_LlNftEntryPoint;
  ldmkSolanaSigner: DefaultFeature;
  ldmkCosmosSigner: DefaultFeature;
  suiGraphqlTransport: DefaultFeature;
  ldmkConnectApp: DefaultFeature;
  lldNetworkBasedAddAccount: DefaultFeature;
  llmDatadog: {
    enabled: boolean;
    params: Partial<{
      batchProcessingLevel: "MEDIUM" | "HIGH" | "LOW";
      batchSize: "LARGE" | "MEDIUM" | "SMALL";
      bundleLogsWithRum: boolean;
      bundleLogsWithTraces: boolean;
      longTaskThresholdMs: number | false;
      nativeInteractionTracking: boolean;
      nativeLongTaskThresholdMs: number | false;
      nativeViewTracking: boolean;
      resourceTracingSamplingRate: number;
      serviceName: string;
      sessionSamplingRate: number;
      trackBackgroundEvents: boolean;
      trackFrustrations: boolean;
      trackErrors: boolean;
      trackResources: boolean;
      trackInteractions: boolean;
      trackWatchdogTerminations: boolean;
      uploadFrequency: "AVERAGE" | "FREQUENT" | "RARE";
      vitalsUpdateFrequency: "AVERAGE" | "FREQUENT" | "RARE" | "NEVER";
    }>;
  };
  lldDatadog: {
    enabled: boolean;
    params: Partial<{
      sessionSamplingRate: number;
      sessionReplaySampleRate: number;
      defaultPrivacyLevel: string;
      traceSampleRate: number;
      allowedTracingUrls: string[];
      profilingSampleRate: number;
    }>;
  };
  llmNanoSDeprecation: DefaultFeature;
  llmSentry: DefaultFeature;
  onboardingIgnoredOsUpdates: Feature_OnboardingIgnoredOSUpdates;
  supportDeviceApex: DefaultFeature;
  llmSyncOnboardingIncr1: DefaultFeature;
  lldSyncOnboardingIncr1: DefaultFeature;
  onboardingWidget: DefaultFeature;
  noah: Feature_Noah;
  newSendFlow: Feature_NewSendFlow;
  zcashShielded: DefaultFeature;
  llmNanoOnboardingFundWallet: DefaultFeature;
  lldRebornABtest: DefaultFeature;
  llmRebornABtest: DefaultFeature;
  lifiSolana: DefaultFeature;
  llmOnboardingEnableSync: Feature_OnboardingEnableSync;
  lldOnboardingEnableSync: Feature_OnboardingEnableSync;
  lwdGenericAwarenessModal: DefaultFeature;
  lwdOnboardingCounterfeitWarning: DefaultFeature;
  lwmAnalyticsConsentOnboarding: DefaultFeature;
  lwmGenericAwarenessModal: DefaultFeature;
  lwmOnboardingCounterfeitWarning: DefaultFeature;
  lwmNotificationsOptIn: DefaultFeature;
  lwmProductTour: DefaultFeature;
  lwmBackupHub: DefaultFeature;
  lwmWallet40: Feature_LwmWallet40;
  lwmQuickActionsCtasVariant: DefaultFeature;
  lwdWallet40: Feature_LwdWallet40;
  addressPoisoningOperationsFilter: Feature_AddressPoisoningOperationsFilter;
  concordiumIdAppLinks: Feature_ConcordiumIdAppLinks;
  concordiumVerifyAddress: DefaultFeature;
  lldHideSmallValueTokenOperations: Feature_LldHideSmallValueTokenOperations;
  llmTransferButtonCopyVariant: Feature_LlmTransferButtonCopyVariant;
  lldTezosStaking: DefaultFeature;
  llmTezosStaking: DefaultFeature;
  swapToEarn: DefaultFeature;
};

/**
 * FeatureId type.
 * @deprecated Moved to `@shared/feature-flags`. Use `FeatureId` from `@shared/feature-flags` instead.
 */
export type FeatureId = keyof Features;

/**
 * EthStakingProvider category type.
 * @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`.
 */
export type EthStakingProviderCategory = "liquid" | "pooling" | "protocol" | "restaking";

/**
 * EthStakingProvider rewards strategy.
 * @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`.
 */
export type EthStakingProviderRewardsStrategy =
  | "basic"
  | "auto-compounded"
  | "daily"
  | "eigenlayer_points"
  | "validator";

/**
 * EthStakingProvider.
 * @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`.
 */
export interface EthStakingProvider {
  id: string;
  name: string;
  category: EthStakingProviderCategory;
  rewardsStrategy: EthStakingProviderRewardsStrategy;
  min?: number;
  disabled?: boolean;
  icon?: string;
  liveAppId: string;
  /** Requires Liquid Staking Token */
  lst?: boolean;
  /** Min required aount to stake (in ETH) */
  queryParams?: Record<string, string>;
  supportLink?: string;
}

/**
 * Features types.
 * @deprecated Moved to `@shared/feature-flags`. Use `Features["ethStakingProviders"]` from `@shared/feature-flags` instead.
 */
export type Feature_EthStakingProviders = Feature<{
  listProvider: EthStakingProvider[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["transactionsAlerts"]` from `@shared/feature-flags` instead. */
export type Feature_TransactionsAlerts = Feature<{
  chainwatchBaseUrl: string;
  networks: ChainwatchNetwork[];
}>;

/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type NotificationsPromptAfterActionSource =
  | "onboarding"
  | "send"
  | "dapp_complete"
  | "receive"
  | "swap"
  | "stake"
  | "add_favorite_coin";

/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type NotificationsCategoryConfig = {
  displayed: boolean;
  category: string;
  drawerPromptEnabled?: boolean;
  drawerPromptActions?: NotificationsPromptAfterActionSource[];
};

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["swapWalletApiPartnerList"]` from `@shared/feature-flags` instead. */
export type Feature_SwapWalletApiPartnerList = Feature<{
  list: string[];
}>;

/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type PlatformManifestId = "stakekit" | "kiln-widget" | "earn";

/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type RedirectQueryParam<M extends PlatformManifestId> = "stakekit" extends M
  ? {
      yieldId: string;
    }
  : unknown;

/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type Redirect<M extends PlatformManifestId> = {
  platform: PlatformManifestId;
  name: string;
  queryParams?: Record<string, string> & RedirectQueryParam<M>;
};

/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type VersionedRedirect = {
  desktop_version?: string;
  mobile_version?: string;
  redirects: Record<string, Redirect<PlatformManifestId>>;
};

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["stakePrograms"]` from `@shared/feature-flags` instead. */
export type Feature_StakePrograms = Feature<{
  list: string[];
  /** redirects is a dictionary of crypto asset ids to partner app params for overriding flows for specific tokens. */
  redirects: Record<string, Redirect<PlatformManifestId>>;
  versions?: VersionedRedirect[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["stakeAccountBanner"]` from `@shared/feature-flags` instead. */
export type Feature_StakeAccountBanner = Feature<{ [blockchainName: string]: any }>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["referralProgramDesktopSidebar"]` from `@shared/feature-flags` instead. */
export type Feature_ReferralProgramDesktopSidebar = Feature<{
  path: string;
  isNew: boolean;
  amount: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["brazePushNotifications"]` from `@shared/feature-flags` instead. */
export type Feature_BrazePushNotifications = Feature<{
  reprompt_schedule: Array<{
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>;
  action_events: {
    complete_onboarding: {
      enabled: boolean;
      timer: number;
    };
    send: {
      enabled: boolean;
      timer: number;
    };
    receive: {
      enabled: boolean;
      timer: number;
    };
    buy: {
      enabled: boolean;
      timer: number;
    };
    swap: {
      enabled: boolean;
      timer: number;
    };
    stake: {
      enabled: boolean;
      timer: number;
    };
    add_favorite_coin: {
      enabled: boolean;
      timer: number;
    };
    dapp_complete: {
      enabled: boolean;
      timer: number;
    };
  };
  inactivity_enabled: boolean;
  inactivity_reprompt: {
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  notificationsCategories: NotificationsCategoryConfig[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["receiveStakingFlowConfigDesktop"]` from `@shared/feature-flags` instead. */
export type Feature_ReceiveStakingFlowConfigDesktop = Feature<{
  [blockchainName: string]: {
    enabled: boolean;
    supportLink: string;
    direct: boolean;
  };
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["storyly"]` from `@shared/feature-flags` instead. */
export type Feature_Storyly = Feature<{
  stories: {
    [key in StorylyInstanceID]: StorylyInstanceType;
  };
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["newsfeedPage"]` from `@shared/feature-flags` instead. */
export type Feature_NewsfeedPage = Feature<{
  cryptopanicApiKey: string;
  whitelistedLocales: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["protectServicesMobile"]` from `@shared/feature-flags` instead. */
export type Feature_ProtectServicesMobile = Feature<{
  deeplink: string;
  bannerSubscriptionNotification: boolean;
  onboardingRestore: {
    restoreInfoDrawer: {
      enabled: boolean;
      supportLinkURI: string;
    };
    postOnboardingURI: string;
  };
  managerStatesData: {
    NEW: {
      quickAccessURI: string;
      alreadyOnboardedURI: string;
    };
  };
  account: {
    homeURI: string;
  };
  protectId: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["protectServicesDesktop"]` from `@shared/feature-flags` instead. */
export type Feature_ProtectServicesDesktop = Feature<{
  openWithDevTools: boolean;
  availableOnDesktop: boolean;
  openRecoverFromSidebar: boolean;
  discoverTheBenefitsLink: string;
  bannerSubscriptionNotification: boolean;
  onboardingCompleted: {
    upsellURI: string;
    restore24URI: string;
    alreadyDeviceSeededURI: string;
  };
  account: {
    homeURI: string;
  };
  protectId: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["recoverUpsellPostOnboarding"]` from `@shared/feature-flags` instead. */
export type Feature_RecoverUpsellPostOnboarding = Feature<{
  deviceIds: DeviceModelId[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["deviceInitialApps"]` from `@shared/feature-flags` instead. */
export type Feature_DeviceInitialApps = Feature<{
  apps: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["buyDeviceFromLive"]` from `@shared/feature-flags` instead. */
export type Feature_BuyDeviceFromLive = Feature<{
  debug: boolean;
  url: string | null;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["concordiumIdAppLinks"]` from `@shared/feature-flags` instead. */
export type Feature_ConcordiumIdAppLinks = Feature<{
  appStore: string;
  playStore: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["discover"]` from `@shared/feature-flags` instead. */
export type Feature_Discover = Feature<{
  version: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["domainInputResolution"]` from `@shared/feature-flags` instead. */
export type Feature_DomainInputResolution = Feature<{
  supportedCurrencyIds: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["editEvmTx"]` from `@shared/feature-flags` instead. */
export type Feature_EditEvmTx = Feature<{
  supportedCurrencyIds: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["evmNativeStaking"]` from `@shared/feature-flags` instead. */
export type Feature_EvmNativeStaking = Feature<{
  supportedCurrencyIds: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["editBitcoinTx"]` from `@shared/feature-flags` instead. */
export type Feature_EditBitcoinTx = Feature<{
  supportedCurrencyIds: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["firebaseEnvironmentReadOnly"]` from `@shared/feature-flags` instead. */
export type Feature_FirebaseEnvironmentReadOnly = Feature<{
  comment: string;
  project: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ldmkTransport"]` from `@shared/feature-flags` instead. */
export type Feature_LdmkTransport = Feature<{
  warningVisible: boolean;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["npsRatingsPrompt"]` from `@shared/feature-flags` instead. */
export type Feature_NpsRatingsPrompt = Feature<{
  conditions: {
    disappointed_delay: {
      seconds: number;
    };
    minimum_accounts_number: number;
    minimum_app_starts_number: number;
    minimum_duration_since_app_first_start: {
      seconds: number;
    };
    minimum_number_of_app_starts_since_last_crash: number;
    not_now_delay: {
      seconds: number;
    };
    satisfied_then_not_now_delay: {
      seconds: number;
    };
  };
  happy_moments: {
    route_name: string;
    timer: number;
    type: string;
  }[];
  support_email: string;
  typeform_url: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ratingsPrompt"]` from `@shared/feature-flags` instead. */
export type Feature_RatingsPrompt = Feature<{
  conditions: {
    disappointed_delay: {
      days: number;
    };
    minimum_accounts_number: number;
    minimum_app_starts_number: number;
    minimum_duration_since_app_first_start: {
      days: number;
    };
    minimum_number_of_app_starts_since_last_crash: number;
    not_now_delay: {
      days: number;
    };
    satisfied_then_not_now_delay: {
      days: number;
    };
  };
  happy_moments: {
    route_name: string;
    timer: number;
    type: string;
  }[];
  support_email: string;
  typeform_url: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxSwapLiveApp"]` from `@shared/feature-flags` instead. */
export type Feature_PtxSwapLiveApp = Feature<{
  manifest_id: string;
  currencies?: string[];
  families?: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxPerpsLiveAppMobile"]` from `@shared/feature-flags` instead. */
export type Feature_PtxPerpsLiveApp = Feature<{
  manifest_id: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxBorrowLiveApp"]` from `@shared/feature-flags` instead. */
export type Feature_PtxBorrowLiveApp = Feature<{
  manifest_id: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxEarnLiveApp"]` from `@shared/feature-flags` instead. */
export type Feature_PtxEarnLiveApp = Feature<{
  manifest_id: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["fetchAdditionalCoins"]` from `@shared/feature-flags` instead. */
export type Feature_FetchAdditionalCoins = Feature<{
  batch: number;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldAnalyticsOptInPrompt"]` from `@shared/feature-flags` instead. */
export type Feature_LldAnalyticsOptInPrompt = Feature<{
  variant: ABTestingVariants;
  entryPoints: Array<string>;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldActionCarousel"]` from `@shared/feature-flags` instead. */
export type Feature_lldActionCarousel = Feature<{
  variant: ABTestingVariants;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldRefreshMarketData"]` from `@shared/feature-flags` instead. */
export type Feature_LldRefreshMarketData = Feature<{
  refreshTime: number;
}>;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmRefreshMarketData"]` from `@shared/feature-flags` instead. */
export type Feature_LlmRefreshMarketData = Feature<{
  refreshTime: number;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["buySellUi"]` from `@shared/feature-flags` instead. */
export type Feature_BuySellUiManifest = Feature<{
  manifestId: string; // id of the app to use for the Buy/Sell UI, e.g. "buy-sell-ui"
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["buySellLoader"]` from `@shared/feature-flags` instead. */
export type Feature_BuySellLoader = Feature<{
  durationMs: number;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldWalletSync"]` from `@shared/feature-flags` instead. */
export type Feature_LldWalletSync = Feature<{
  environment: WalletSyncEnvironment;
  watchConfig: WalletSyncWatchConfig;
  learnMoreLink: string;
}>;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmWalletSync"]` from `@shared/feature-flags` instead. */
export type Feature_LlmWalletSync = Feature<{
  environment: WalletSyncEnvironment;
  watchConfig: WalletSyncWatchConfig;
  learnMoreLink: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmLedgerSyncEntryPoints"]` from `@shared/feature-flags` instead. */
export type Feature_LlmLedgerSyncEntryPoints = Feature<{
  manager: boolean;
  accounts: boolean;
  settings: boolean;
  onboarding: boolean;
  postOnboarding: boolean;
}>;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldLedgerSyncEntryPoints"]` from `@shared/feature-flags` instead. */
export type Feature_LldLedgerSyncEntryPoints = Feature<{
  manager: boolean;
  accounts: boolean;
  settings: boolean;
  onboarding: boolean;
  postOnboarding: boolean;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llNftEntryPoint"]` from `@shared/feature-flags` instead. */
export type Feature_LlNftEntryPoint = Feature<{
  magiceden: boolean;
  opensea: boolean;
  chains: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llCounterValueGranularitiesRates"]` from `@shared/feature-flags` instead. */
export type Feature_LlCounterValueGranularitiesRates = Feature<{
  daily: number;
  hourly: number;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmMmkvMigration"]` from `@shared/feature-flags` instead. */
export type Feature_LlmMmkvMigration = Feature<{
  shouldRollback: boolean | null;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmModularDrawer"]` from `@shared/feature-flags` instead. */
export type Feature_ModularDrawer = Feature<{
  add_account: boolean;
  live_app: boolean;
  live_apps_allowlist: string[];
  live_apps_blocklist: string[];
  receive_flow: boolean;
  send_flow: boolean;
  enableModularization: boolean;
  searchDebounceTime: number;
  backendEnvironment: string;
  enableDialogDesktop?: boolean;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["noah"]` from `@shared/feature-flags` instead. */
export type Feature_Noah = Feature<{
  activeCurrencyIds: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["newSendFlow"]` from `@shared/feature-flags` instead. */
export type Feature_NewSendFlow = Feature<{
  families?: string[];
  excludedCurrencyIds?: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["addressPoisoningOperationsFilter"]` from `@shared/feature-flags` instead. */
export type Feature_AddressPoisoningOperationsFilter = Feature<{
  families: string[];
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldHideSmallValueTokenOperations"]` from `@shared/feature-flags` instead. */
export type Feature_LldHideSmallValueTokenOperations = Feature<{
  /** USD threshold below which incoming token operations are hidden. Defaults to $0.5. */
  thresholdUsd: number;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["counterValue"]` from `@shared/feature-flags` instead. */
export type Feature_CounterValue = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["mockFeature"]` from `@shared/feature-flags` instead. */
export type Feature_MockFeature = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["disableNftSend"]` from `@shared/feature-flags` instead. */
export type Feature_DisableNftSend = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["disableNftLedgerMarket"]` from `@shared/feature-flags` instead. */
export type Feature_DisableNftLedgerMarket = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["disableNftRaribleOpensea"]` from `@shared/feature-flags` instead. */
export type Feature_DisableNftRaribleOpensea = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxServiceCtaExchangeDrawer"]` from `@shared/feature-flags` instead. */
export type Feature_PtxServiceCtaExchangeDrawer = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxServiceCtaScreens"]` from `@shared/feature-flags` instead. */
export type Feature_PtxServiceCtaScreens = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["portfolioExchangeBanner"]` from `@shared/feature-flags` instead. */
export type Feature_PortfolioExchangeBanner = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxSwapReceiveTRC20WithoutTrx"]` from `@shared/feature-flags` instead. */
export type Feature_PtxSwapReceiveTRC20WithoutTrx = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["flexibleContentCards"]` from `@shared/feature-flags` instead. */
export type Feature_FlexibleContentCards = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["myLedgerDisplayAppDeveloperName"]` from `@shared/feature-flags` instead. */
export type Feature_MyLedgerDisplayAppDeveloperName = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldChatbotSupport"]` from `@shared/feature-flags` instead. */
export type Feature_LldChatbotSupport = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmChatbotSupport"]` from `@shared/feature-flags` instead. */
export type Feature_LlmChatbotSupport = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["enableAppsBackup"]` from `@shared/feature-flags` instead. */
export type Feature_EnableAppsBackup = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["web3hub"]` from `@shared/feature-flags` instead. */
export type Feature_web3hub = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldMemoTag"]` from `@shared/feature-flags` instead. */
export type Feature_MemoTag = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxEarnDrawerConfiguration"]` from `@shared/feature-flags` instead. */
export type Feature_PtxEarnDrawerConfiguration = Feature<{
  assets?: {
    filter?: "topNetworks" | "undefined";
    leftElement?: "apy" | "marketTrend" | "undefined";
    rightElement?: "balance" | "marketTrend" | "undefined";
  };
  networks?: {
    leftElement?: "numberOfAccounts" | "numberOfAccountsAndApy" | "undefined";
    rightElement?: "balance" | "undefined";
  };
}>;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxEarnUi"]` from `@shared/feature-flags` instead. */
export type Feature_PtxEarnUi = Feature<{
  value: string;
}>;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxSwapMoonpayProvider"]` from `@shared/feature-flags` instead. */
export type Feature_PtxSwapMoonpayProvider = DefaultFeature;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxSwapExodusProvider"]` from `@shared/feature-flags` instead. */
export type Feature_PtxSwapExodusProvider = DefaultFeature;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["ptxSwapDetailedView"]` from `@shared/feature-flags` instead. */
export type Feature_PtxSwapDetailedView = Feature<{
  variant: ABTestingVariants;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmRebornLP"]` from `@shared/feature-flags` instead. */
export type Feature_LlmRebornLP = Feature<{
  variant: ABTestingVariants;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldNanoSUpsellBanners"]` from `@shared/feature-flags` instead. */
export type Feature_LldNanoSUpsellBanners = Feature<{
  opted_in: LldNanoSUpsellBannersConfig;
  opted_out: LldNanoSUpsellBannersConfig & { portfolio: boolean };
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmNanoSUpsellBanners"]` from `@shared/feature-flags` instead. */
export type Feature_LlmNanoSUpsellBanners = Feature<{
  opted_in: LlmNanoSUpsellBannersConfig;
  opted_out: LlmNanoSUpsellBannersConfig;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["llmTransferButtonCopyVariant"]` from `@shared/feature-flags` instead. */
export type Feature_LlmTransferButtonCopyVariant = Feature<{
  variantId: string;
  buttonLabel?: string;
  modalTitle?: string;
  rowReceiveTitle?: string;
  rowSendTitle?: string;
  rowCashToStableTitle?: string;
  rowCashToStableDescription?: string;
}>;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["supportDeviceApex"]` from `@shared/feature-flags` instead. */
export type Feature_SupportDeviceApex = DefaultFeature;

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lldOnboardingEnableSync"]` from `@shared/feature-flags` instead. */
export type Feature_OnboardingEnableSync = Feature<{
  nanos: boolean;
  touchscreens: boolean;
}>;

/**
 * Array of firmware versions that are ignored for the given device model
 * @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`.
 */
export type IgnoredOSUpdates = Array<string>;

/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type Platform = "ios" | "android" | "macos" | "windows" | "linux";

/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type IgnoredOSUpdatesByPlatform = { [M in DeviceModelId]?: IgnoredOSUpdates };

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["onboardingIgnoredOsUpdates"]` from `@shared/feature-flags` instead. */
export type Feature_OnboardingIgnoredOSUpdates = Feature<{
  [P in Platform]?: IgnoredOSUpdatesByPlatform;
}>;

type Feature_Wallet40_Params = {
  marketBanner: boolean;
  graphRework: boolean;
  quickActionCtas: boolean;
  mainNavigation: boolean;
  tour: boolean;
  lazyOnboarding: boolean;
  balanceRefreshRework: boolean;
  assetSection: boolean;
  operationsList: boolean;
  aggregatedAssets: boolean;
  myWallet: boolean;
  pnl: boolean;
  assetDiscoverability: boolean;
  // Specifics
  brazePlacement?: boolean;
  newReceiveDialog?: boolean;
  earnUpselling?: boolean;
  earnSimulator?: boolean;
  q2Tour?: boolean;
};

/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lwmWallet40"]` from `@shared/feature-flags` instead. */
export type Feature_LwmWallet40 = Feature<Feature_Wallet40_Params>;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lwdWallet40"]` from `@shared/feature-flags` instead. */
export type Feature_LwdWallet40 = Feature<
  {
    newReceiveDialog: boolean;
  } & Feature_Wallet40_Params
>;
/** @deprecated Moved to `@shared/feature-flags`. Use `Features["lwmNewWordingOptInNotificationsDrawer"]` from `@shared/feature-flags` instead. */
export type Feature_LwmNewWordingOptInNotificationsDrawer = Feature<{
  variant: ABTestingVariants;
}>;

/**
 * Utils types.
 * @deprecated Moved to `@shared/feature-flags`. Use `FeatureMap` from `@shared/feature-flags` instead.
 */
export type FeatureMap<T = Feature> = { [key in FeatureId]: T };
/** @deprecated Moved to `@shared/feature-flags`. Use `OptionalFeatureMap` from `@shared/feature-flags` instead. */
export type OptionalFeatureMap<T = Feature> = { [key in FeatureId]?: T };
/** @deprecated Part of the legacy Ledger Live feature-flag types. Moved to `@shared/feature-flags`. */
export type FeatureParam<T extends FeatureId> = Features[T]["params"];
