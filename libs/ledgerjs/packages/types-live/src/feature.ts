import { ChainwatchNetwork } from "./chainwatch";

/**
 * Add others with union (e.g. "learn" | "market" | "foo")
 */
export type FeatureId =
  | "learn"
  | "brazePushNotifications"
  | "brazeLearn"
  | "llmNewDeviceSelection"
  | "llmNewFirmwareUpdateUx"
  | "ratingsPrompt"
  | "npsRatingsPrompt"
  | "counterValue"
  | "deviceInitialApps"
  | "buyDeviceFromLive"
  | "ptxEarn"
  | "currencyAvalancheCChain"
  | "currencyStacks"
  | "currencyOptimism"
  | "currencyOptimismGoerli"
  | "currencyArbitrum"
  | "currencyArbitrumGoerli"
  | "currencyRsk"
  | "currencyBittorrent"
  | "currencyKavaEvm"
  | "currencyEvmosEvm"
  | "currencyEnergyWeb"
  | "currencyAstar"
  | "currencyMetis"
  | "currencyBoba"
  | "currencyMoonriver"
  | "currencyVelasEvm"
  | "currencySyscoin"
  | "currencyAxelar"
  | "currencySecretNetwork"
  | "currencyDesmos"
  | "currencyUmee"
  | "currencyStargaze"
  | "currencyOnomy"
  | "currencyPersistence"
  | "currencyQuicksilver"
  | "currencyInternetComputer"
  | "depositNetworkBannerMobile"
  | "depositWithdrawBannerMobile"
  | "currencyTelosEvm"
  | "currencyCoreum"
  | "currencyPolygonZkEvm"
  | "currencyPolygonZkEvmTestnet"
  | "currencyBase"
  | "currencyBaseGoerli"
  | "currencyKlaytn"
  | "mockFeature"
  | "multibuyNavigation"
  | "syncOnboarding"
  | "walletConnectLiveApp"
  | "walletConnectEntryPoint"
  | "customImage"
  | "referralProgramDiscoverCard"
  | "referralProgramDesktopBanner"
  | "referralProgramDesktopSidebar"
  | "referralProgramMobile"
  | "disableNftSend"
  | "disableNftLedgerMarket"
  | "disableNftRaribleOpensea"
  | "walletNftGallery"
  | "receiveStakingFlowConfigDesktop"
  | "ethStakingProviders"
  | "storyly"
  | "staxWelcomeScreen"
  | "postOnboardingClaimNft"
  | "postOnboardingAssetsTransfer"
  | "firebaseEnvironmentReadOnly"
  | "protectServicesMobile"
  | "protectServicesDesktop"
  | "ptxServiceCtaExchangeDrawer"
  | "ptxServiceCtaScreens"
  | "swapWalletApiPartnerList"
  | "stakePrograms"
  | "portfolioExchangeBanner"
  | "objkt"
  | "editEthTx"
  | "stakeAccountBanner"
  | "newsfeedPage"
  | "domainInputResolution"
  | "discover"
  | "protectServicesDiscoverDesktop"
  | "transactionsAlerts"
  | "listAppsV2";

/**
 * We use objects instead of direct booleans for potential future improvements like feature versioning etc
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
   *  Whether the remote value of `enabled` was overriden due to `desktop_version`
   */
  enabledOverriddenForCurrentDesktopVersion?: boolean;

  /**
   * The `mobile_version` option is mobile specific, it has no impact on mobile
   * If set, the feature is disabled when the mobile app version does not satisfies this param
   * It should respect the semantic versioning specification (https://semver.org/)
   */
  mobile_version?: string;

  /**
   * Whether the remote value of `enabled` was overriden due to `mobile_version`
   */
  enabledOverriddenForCurrentMobileVersion?: boolean;

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
 * Utils types
 */
export type FeatureMap<T = Feature> = { [key in FeatureId]: T };
export type OptionalFeatureMap<T = Feature> = { [key in FeatureId]?: T };

/**
 * Extra features types
 */
export type BasicFeature = unknown;

export type EthStakingProviders = {
  listProvider: {
    id: string;
    name: string;
    liveAppId: string;
    supportLink?: string;
    icon?: string;
    queryParams?: Record<string, string>;
  }[];
};

export type WalletNftGallery = {
  lazyLoadScreens: boolean;
};

export type WalletConnectLiveApp = {
  liveAppId: string;
};

export type TransactionsAlerts = {
  chainwatchBaseUrl: string;
  networks: ChainwatchNetwork[];
};

export type SwapWalletApiPartnerList = {
  list: string[];
};

export type StakePrograms = {
  list: string[];
};

export type StakeAccountBanner = { [blockchainName: string]: any };

export type ReferralProgramMobile = {
  path: string;
};

export type ReferralProgramDiscoverCard = {
  url: string;
};

export type ReferralProgramDesktopSidebar = {
  path: string;
  isNew: boolean;
  amount: string;
};

export type BrazePushNotifications = {
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
};

export type ReceiveStakingFlowConfigDesktop = {
  [blockchainName: string]: {
    enabled: boolean;
    supportLink: string;
    direct: boolean;
  };
};

export type Learn = {
  mobile: { url: string };
  desktop: { url: string };
};

export type PtxEarn = {
  liveAppId: string;
};

export type Storyly = {
  stories: { [storyName: string]: { testingEnabled: boolean; token: string } };
};

export type NewsfeedPage = {
  cryptopanicApiKey: string;
  whitelistedLocales: string[];
};

export type ProtectServicesMobile = {
  deeplink: string;
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
    };
  };
  login: {
    loginURI: string;
  };
  protectId: string;
};

export type ProtectServicesDesktop = {
  availableOnDesktop: boolean;
  openRecoverFromSidebar: boolean;
  discoverTheBenefitsLink: string;
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
    alreadySubscribedURI: string;
  };
  account: {
    homeURI: string;
    loginURI: string;
  };
  protectId: string;
};
