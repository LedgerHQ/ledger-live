import { ABTestingVariants } from "./ABTesting";
import { ChainwatchNetwork } from "./chainwatch";
import { StorylyInstanceID, StorylyInstanceType } from "./storyly";
import { WalletSyncEnvironment, WalletSyncWatchConfig } from "./walletSync";

/**
 * Feature type.
 *
 * @dev We use objects instead of direct booleans for potential future improvements.
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
 */
export type DefaultFeature = Feature<unknown>;

/**
 * Currency Features type.
 */
export type CurrencyFeatures = {
  currencyAvalancheCChain: DefaultFeature;
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
  currencyBoba: DefaultFeature;
  currencyMoonriver: DefaultFeature;
  currencyVelasEvm: DefaultFeature;
  currencySyscoin: DefaultFeature;
  currencyAxelar: DefaultFeature;
  currencySecretNetwork: DefaultFeature;
  currencySeiNetwork: DefaultFeature;
  currencyDesmos: DefaultFeature;
  currencyDydx: DefaultFeature;
  currencyUmee: DefaultFeature;
  currencyStargaze: DefaultFeature;
  currencyOnomy: DefaultFeature;
  currencyPersistence: DefaultFeature;
  currencyQuicksilver: DefaultFeature;
  currencyInternetComputer: DefaultFeature;
  currencyInjective: DefaultFeature;
  currencyTelosEvm: DefaultFeature;
  currencyCoreum: DefaultFeature;
  currencyPolygonZkEvm: DefaultFeature;
  currencyPolygonZkEvmTestnet: DefaultFeature;
  currencyBase: DefaultFeature;
  currencyBaseSepolia: DefaultFeature;
  currencyKlaytn: DefaultFeature;
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
  currencyIcon: DefaultFeature;
  currencyTon: DefaultFeature;
  currencyEtherlink: DefaultFeature;
  currencyZkSync: DefaultFeature;
  currencyZkSyncSepolia: DefaultFeature;
  currencyMantra: DefaultFeature;
  currencyCryptoOrg: DefaultFeature;
};

/**
 * Features type.
 *
 * @dev Add features here.
 */
export type Features = CurrencyFeatures & {
  brazePushNotifications: Feature_BrazePushNotifications;
  brazeLearn: Feature_BrazeLearn;
  ratingsPrompt: Feature_RatingsPrompt;
  npsRatingsPrompt: Feature_NpsRatingsPrompt;
  counterValue: Feature_CounterValue;
  deviceInitialApps: Feature_DeviceInitialApps;
  buyDeviceFromLive: Feature_BuyDeviceFromLive;
  mockFeature: Feature_MockFeature;
  buySellUi: Feature_BuySellUiManifest;
  buySellShortcut: DefaultFeature;
  referralProgramDesktopSidebar: Feature_ReferralProgramDesktopSidebar;
  disableNftSend: Feature_DisableNftSend;
  disableNftLedgerMarket: Feature_DisableNftLedgerMarket;
  disableNftRaribleOpensea: Feature_DisableNftRaribleOpensea;
  receiveStakingFlowConfigDesktop: Feature_ReceiveStakingFlowConfigDesktop;
  ethStakingModalWithFilters: DefaultFeature;
  ethStakingProviders: Feature_EthStakingProviders;
  storyly: Feature_Storyly;
  postOnboardingAssetsTransfer: Feature_PostOnboardingAssetsTransfer;
  firebaseEnvironmentReadOnly: Feature_FirebaseEnvironmentReadOnly;
  protectServicesMobile: Feature_ProtectServicesMobile;
  protectServicesDesktop: Feature_ProtectServicesDesktop;
  ptxServiceCtaExchangeDrawer: Feature_PtxServiceCtaExchangeDrawer;
  ptxServiceCtaScreens: Feature_PtxServiceCtaScreens;
  swapWalletApiPartnerList: Feature_SwapWalletApiPartnerList;
  stakePrograms: Feature_StakePrograms;
  portfolioExchangeBanner: Feature_PortfolioExchangeBanner;
  editEvmTx: Feature_EditEvmTx;
  stakeAccountBanner: Feature_StakeAccountBanner;
  newsfeedPage: Feature_NewsfeedPage;
  domainInputResolution: Feature_DomainInputResolution;
  discover: Feature_Discover;
  transactionsAlerts: Feature_TransactionsAlerts;
  fetchAdditionalCoins: Feature_FetchAdditionalCoins;
  ptxCard: DefaultFeature;
  ptxSwapLiveAppMobile: DefaultFeature;
  ptxSwapLiveApp: Feature_PtxSwapLiveApp;
  ptxSwapReceiveTRC20WithoutTrx: Feature_PtxSwapReceiveTRC20WithoutTrx;
  flexibleContentCards: Feature_FlexibleContentCards;
  llmAnalyticsOptInPrompt: Feature_LlmAnalyticsOptInPrompt;
  lldAnalyticsOptInPrompt: Feature_LldAnalyticsOptInPrompt;
  lldChatbotSupport: Feature_LldChatbotSupport;
  llmChatbotSupport: Feature_LlmChatbotSupport;
  myLedgerDisplayAppDeveloperName: Feature_MyLedgerDisplayAppDeveloperName;
  nftsFromSimplehash: Feature_NftsFromSimpleHash;
  lldActionCarousel: Feature_lldActionCarousel;
  marketperformanceWidgetDesktop: Feature_MarketperformanceWidgetDesktop;
  lldRefreshMarketData: Feature_LldRefreshMarketData;
  llmRefreshMarketData: Feature_LlmRefreshMarketData;
  spamReportNfts: Feature_SpamReportNfts;
  lldWalletSync: Feature_LldWalletSync;
  llmWalletSync: Feature_LlmWalletSync;
  lldNftsGalleryNewArch: DefaultFeature;
  lldnewArchOrdinals: DefaultFeature;
  enableAppsBackup: Feature_EnableAppsBackup;
  web3hub: Feature_web3hub;
  llmMarketQuickActions: DefaultFeature;
  spamFilteringTx: Feature_SpamFilteringTx;
  llmMemoTag: Feature_MemoTag;
  lldMemoTag: Feature_MemoTag;
  ldmkTransport: Feature_LdmkTransport;
  llMevProtection: DefaultFeature;
  llmNetworkBasedAddAccountFlow: DefaultFeature;
  llCounterValueGranularitiesRates: Feature_LlCounterValueGranularitiesRates;
  llmRebornLP: Feature_LlmRebornLP;
  llmAccountListUI: DefaultFeature;
};

/**
 * FeatureId type.
 */
export type FeatureId = keyof Features;

/**
 * EthStakingProvider category type.
 */
export type EthStakingProviderCategory = "liquid" | "pooling" | "protocol" | "restaking";

/**
 * EthStakingProvider rewards strategy.
 */
export type EthStakingProviderRewardsStrategy =
  | "basic"
  | "auto-compounded"
  | "daily"
  | "eigenlayer_points"
  | "validator";

/**
 * EthStakingProvider.
 */
export interface EthStakingProvider {
  id: string;
  category: EthStakingProviderCategory;
  disabled?: boolean;
  icon?: string;
  liveAppId: string;
  /** Requires Liquid Staking Token */
  lst?: boolean;
  min?: number;
  name: string;
  queryParams?: Record<string, string>;
  rewardsStrategy: EthStakingProviderRewardsStrategy;
  supportLink?: string;
}

/**
 * Features types.
 */
export type Feature_EthStakingProviders = Feature<{
  listProvider: EthStakingProvider[];
}>;

export type Feature_TransactionsAlerts = Feature<{
  chainwatchBaseUrl: string;
  networks: ChainwatchNetwork[];
}>;

export type Feature_SwapWalletApiPartnerList = Feature<{
  list: string[];
}>;

export type Feature_StakePrograms = Feature<{
  list: string[];
}>;

export type Feature_StakeAccountBanner = Feature<{ [blockchainName: string]: any }>;

export type Feature_ReferralProgramDesktopSidebar = Feature<{
  path: string;
  isNew: boolean;
  amount: string;
}>;

export type Feature_BrazePushNotifications = Feature<{
  notificationsCategories: {
    displayed: boolean;
    category: string;
  }[];
  trigger_events: {
    route_name: string;
    timer: number;
    type: string;
  }[];
  marketCoinStarred: {
    enabled: boolean;
    timer: number;
  };
  justFinishedOnboarding: {
    enabled: boolean;
    timer: number;
  };
  conditions: {
    default_delay_between_two_prompts: {
      seconds: number;
    };
    maybe_later_delay: {
      seconds: number;
    };
    minimum_accounts_with_funds_number: number;
    minimum_app_starts_number: number;
    minimum_duration_since_app_first_start: {
      seconds: number;
    };
  };
}>;

export type Feature_ReceiveStakingFlowConfigDesktop = Feature<{
  [blockchainName: string]: {
    enabled: boolean;
    supportLink: string;
    direct: boolean;
  };
}>;

export type Feature_Storyly = Feature<{
  stories: {
    [key in StorylyInstanceID]: StorylyInstanceType;
  };
}>;

export type Feature_NewsfeedPage = Feature<{
  cryptopanicApiKey: string;
  whitelistedLocales: string[];
}>;

export type CompatibleDevice = {
  available: boolean;
  comingSoon: boolean;
  name: string;
};

export type Feature_ProtectServicesMobile = Feature<{
  deeplink: string;
  ledgerliveStorageState: boolean;
  bannerSubscriptionNotification: boolean;
  compatibleDevices: CompatibleDevice[];
  onboardingRestore: {
    restoreInfoDrawer: {
      enabled: boolean;
      manualStepsURI: string;
      supportLinkURI: string;
    };
    postOnboardingURI: string;
  };
  managerStatesData: {
    NEW: {
      learnMoreURI: string;
      alreadySubscribedURI: string;
      quickAccessURI: string;
      alreadyOnboardedURI: string;
    };
  };
  account: {
    loginURI: string;
    homeURI: string;
  };
  protectId: string;
}>;

export type Feature_ProtectServicesDesktop = Feature<{
  availableOnDesktop: boolean;
  isNew: boolean;
  openRecoverFromSidebar: boolean;
  discoverTheBenefitsLink: string;
  ledgerliveStorageState: boolean;
  bannerSubscriptionNotification: boolean;
  compatibleDevices: CompatibleDevice[];
  onboardingRestore: {
    restoreInfoDrawer: {
      enabled: boolean;
      manualStepsURI: string;
      supportLinkURI: string;
    };
    postOnboardingURI: string;
  };
  onboardingCompleted: {
    upsellURI: string;
    restore24URI: string;
    alreadySubscribedURI: string;
    alreadyDeviceSeededURI: string;
  };
  account: {
    homeURI: string;
    loginURI: string;
  };
  protectId: string;
}>;

export type Feature_DeviceInitialApps = Feature<{
  apps: string[];
}>;

export type Feature_BuyDeviceFromLive = Feature<{
  debug: boolean;
  url: string | null;
}>;

export type Feature_Discover = Feature<{
  version: string;
}>;

export type Feature_DomainInputResolution = Feature<{
  supportedCurrencyIds: string[];
}>;

export type Feature_EditEvmTx = Feature<{
  supportedCurrencyIds: string[];
}>;

export type Feature_FirebaseEnvironmentReadOnly = Feature<{
  comment: string;
  project: string;
}>;

export type Feature_LdmkTransport = Feature<{
  warningVisible: boolean;
}>;

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

export type Feature_PtxSwapLiveApp = Feature<{
  manifest_id: string;
  currencies?: string[];
  families?: string[];
}>;

export type Feature_FetchAdditionalCoins = Feature<{
  batch: number;
}>;

export type Feature_LlmAnalyticsOptInPrompt = Feature<{
  variant: ABTestingVariants;
  entryPoints: Array<string>;
}>;

export type Feature_LldAnalyticsOptInPrompt = Feature<{
  variant: ABTestingVariants;
  entryPoints: Array<string>;
}>;

export type Feature_lldActionCarousel = Feature<{
  variant: ABTestingVariants;
}>;

export type Feature_MarketperformanceWidgetDesktop = Feature<{
  variant: ABTestingVariants;
  refreshRate: number;
  top: number;
  limit: number;
  supported: boolean;
  enableNewFeature: boolean;
}>;

export type Feature_NftsFromSimpleHash = Feature<{
  threshold: number;
  staleTime: number;
}>;

export type Feature_LldRefreshMarketData = Feature<{
  refreshTime: number;
}>;
export type Feature_LlmRefreshMarketData = Feature<{
  refreshTime: number;
}>;

export type Feature_BuySellUiManifest = Feature<{
  manifestId: string; // id of the app to use for the Buy/Sell UI, e.g. "buy-sell-ui"
}>;

export type Feature_LldWalletSync = Feature<{
  environment: WalletSyncEnvironment;
  watchConfig: WalletSyncWatchConfig;
  learnMoreLink: string;
}>;
export type Feature_LlmWalletSync = Feature<{
  environment: WalletSyncEnvironment;
  watchConfig: WalletSyncWatchConfig;
  learnMoreLink: string;
}>;

export type Feature_LlCounterValueGranularitiesRates = Feature<{
  daily: number;
  hourly: number;
}>;

export type Feature_CounterValue = DefaultFeature;
export type Feature_MockFeature = DefaultFeature;
export type Feature_DisableNftSend = DefaultFeature;
export type Feature_DisableNftLedgerMarket = DefaultFeature;
export type Feature_DisableNftRaribleOpensea = DefaultFeature;
export type Feature_PostOnboardingAssetsTransfer = DefaultFeature;
export type Feature_PtxServiceCtaExchangeDrawer = DefaultFeature;
export type Feature_PtxServiceCtaScreens = DefaultFeature;
export type Feature_PortfolioExchangeBanner = DefaultFeature;
export type Feature_BrazeLearn = DefaultFeature;
export type Feature_PtxSwapReceiveTRC20WithoutTrx = DefaultFeature;
export type Feature_FlexibleContentCards = DefaultFeature;
export type Feature_MyLedgerDisplayAppDeveloperName = DefaultFeature;
export type Feature_LldChatbotSupport = DefaultFeature;
export type Feature_LlmChatbotSupport = DefaultFeature;
export type Feature_SpamReportNfts = DefaultFeature;
export type Feature_EnableAppsBackup = DefaultFeature;
export type Feature_web3hub = DefaultFeature;
export type Feature_lldNftsGalleryNewArch = DefaultFeature;
export type Feature_lldnewArchOrdinals = DefaultFeature;
export type Feature_SpamFilteringTx = DefaultFeature;
export type Feature_MemoTag = DefaultFeature;

export type Feature_LlmRebornLP = Feature<{
  variant: ABTestingVariants;
}>;
/**
 * Utils types.
 */
export type FeatureMap<T = Feature> = { [key in FeatureId]: T };
export type OptionalFeatureMap<T = Feature> = { [key in FeatureId]?: T };
export type FeatureParam<T extends FeatureId> = Features[T]["params"];
