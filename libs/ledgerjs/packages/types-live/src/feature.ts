import { ChainwatchNetwork } from "./chainwatch";

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
  currencyOptimismGoerli: DefaultFeature;
  currencyArbitrum: DefaultFeature;
  currencyArbitrumGoerli: DefaultFeature;
  currencyRsk: DefaultFeature;
  currencyBittorrent: DefaultFeature;
  currencyKavaEvm: DefaultFeature;
  currencyEvmosEvm: DefaultFeature;
  currencyEnergyWeb: DefaultFeature;
  currencyAstar: DefaultFeature;
  currencyMetis: DefaultFeature;
  currencyBoba: DefaultFeature;
  currencyMoonriver: DefaultFeature;
  currencyVelasEvm: DefaultFeature;
  currencySyscoin: DefaultFeature;
  currencyAxelar: DefaultFeature;
  currencySecretNetwork: DefaultFeature;
  currencyDesmos: DefaultFeature;
  currencyUmee: DefaultFeature;
  currencyStargaze: DefaultFeature;
  currencyOnomy: DefaultFeature;
  currencyPersistence: DefaultFeature;
  currencyQuicksilver: DefaultFeature;
  currencyInternetComputer: DefaultFeature;
  currencyTelosEvm: DefaultFeature;
  currencyCoreum: DefaultFeature;
  currencyPolygonZkEvm: DefaultFeature;
  currencyPolygonZkEvmTestnet: DefaultFeature;
  currencyBase: DefaultFeature;
  currencyBaseGoerli: DefaultFeature;
  currencyKlaytn: DefaultFeature;
};

/**
 * Features type.
 */
export type Features = CurrencyFeatures & {
  learn: Feature_Learn;
  brazePushNotifications: Feature_BrazePushNotifications;
  brazeLearn: BrazeLearn;
  llmNewDeviceSelection: LlmNewDeviceSelection;
  llmNewFirmwareUpdateUx: LlmNewFirmwareUpdateUx;
  ratingsPrompt: RatingsPrompt;
  npsRatingsPrompt: NpsRatingsPrompt;
  counterValue: CounterValue;
  deviceInitialApps: DeviceInitialApps;
  buyDeviceFromLive: BuyDeviceFromLive;
  ptxEarn: Feature_PtxEarn;
  depositNetworkBannerMobile: DepositNetworkBannerMobile;
  depositWithdrawBannerMobile: DepositWithdrawBannerMobile;
  mockFeature: MockFeature;
  multibuyNavigation: MultibuyNavigation;
  syncOnboarding: SyncOnboarding;
  walletConnectLiveApp: Feature_WalletConnectLiveApp;
  walletConnectEntryPoint: WalletConnectEntryPoint;
  customImage: CustomImage;
  referralProgramDiscoverCard: Feature_ReferralProgramDiscoverCard;
  referralProgramDesktopBanner: ReferralProgramDesktopBanner;
  referralProgramDesktopSidebar: Feature_ReferralProgramDesktopSidebar;
  referralProgramMobile: Feature_ReferralProgramMobile;
  disableNftSend: DisableNftSend;
  disableNftLedgerMarket: DisableNftLedgerMarket;
  disableNftRaribleOpensea: DisableNftRaribleOpensea;
  walletNftGallery: Feature_WalletNftGallery;
  receiveStakingFlowConfigDesktop: Feature_ReceiveStakingFlowConfigDesktop;
  ethStakingProviders: Feature_EthStakingProviders;
  storyly: Feature_Storyly;
  staxWelcomeScreen: StaxWelcomeScreen;
  postOnboardingClaimNft: PostOnboardingClaimNft;
  postOnboardingAssetsTransfer: PostOnboardingAssetsTransfer;
  firebaseEnvironmentReadOnly: FirebaseEnvironmentReadOnly;
  protectServicesMobile: Feature_ProtectServicesMobile;
  protectServicesDesktop: Feature_ProtectServicesDesktop;
  ptxServiceCtaExchangeDrawer: PtxServiceCtaExchangeDrawer;
  ptxServiceCtaScreens: PtxServiceCtaScreens;
  swapWalletApiPartnerList: Feature_SwapWalletApiPartnerList;
  stakePrograms: Feature_StakePrograms;
  portfolioExchangeBanner: PortfolioExchangeBanner;
  objkt: Objkt;
  editEthTx: EditEthTx;
  stakeAccountBanner: Feature_StakeAccountBanner;
  newsfeedPage: Feature_NewsfeedPage;
  domainInputResolution: DomainInputResolution;
  discover: Discover;
  protectServicesDiscoverDesktop: ProtectServicesDiscoverDesktop;
  transactionsAlerts: Feature_TransactionsAlerts;
  listAppsV2: ListAppsV2;
};

/**
 * FeatureId type.
 */
export type FeatureId = keyof Features;

/**
 * Features types.
 */
export type Feature_EthStakingProviders = Feature<{
  listProvider: {
    id: string;
    name: string;
    liveAppId: string;
    supportLink?: string;
    icon?: string;
    queryParams?: Record<string, string>;
  }[];
}>;

export type Feature_WalletNftGallery = Feature<{
  lazyLoadScreens: boolean;
}>;

export type Feature_WalletConnectLiveApp = Feature<{
  liveAppId: string;
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

export type Feature_ReferralProgramMobile = Feature<{
  path: string;
}>;

export type Feature_ReferralProgramDiscoverCard = Feature<{
  url: string;
}>;

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

export type Feature_Learn = Feature<{
  mobile: { url: string };
  desktop: { url: string };
}>;

export type Feature_PtxEarn = Feature<{
  liveAppId: string;
}>;

export type Feature_Storyly = Feature<{
  stories: { [storyName: string]: { testingEnabled: boolean; token: string } };
}>;

export type Feature_NewsfeedPage = Feature<{
  cryptopanicApiKey: string;
  whitelistedLocales: string[];
}>;

export type Feature_ProtectServicesMobile = Feature<{
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
}>;

export type Feature_ProtectServicesDesktop = Feature<{
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
}>;

export type DeviceInitialApps = Feature<{
  apps: string[];
}>;

export type BuyDeviceFromLive = Feature<{
  debug: boolean;
  url: string | null;
}>;

export type DepositNetworkBannerMobile = Feature<{
  url: string;
}>;

export type DepositWithdrawBannerMobile = Feature<{
  url: string;
}>;

export type Discover = Feature<{
  version: string;
}>;

export type DomainInputResolution = Feature<{
  supportedCurrencyIds: string[];
}>;

export type FirebaseEnvironmentReadOnly = Feature<{
  comment: string;
  project: string;
}>;

export type NpsRatingsPrompt = Feature<{
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

export type RatingsPrompt = Feature<{
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

export type LlmNewFirmwareUpdateUx = DefaultFeature;
export type CounterValue = DefaultFeature;
export type MockFeature = DefaultFeature;
export type MultibuyNavigation = DefaultFeature;
export type SyncOnboarding = DefaultFeature;
export type WalletConnectEntryPoint = DefaultFeature;
export type CustomImage = DefaultFeature;
export type ReferralProgramDesktopBanner = DefaultFeature;
export type DisableNftSend = DefaultFeature;
export type DisableNftLedgerMarket = DefaultFeature;
export type DisableNftRaribleOpensea = DefaultFeature;
export type StaxWelcomeScreen = DefaultFeature;
export type PostOnboardingClaimNft = DefaultFeature;
export type PostOnboardingAssetsTransfer = DefaultFeature;
export type PtxServiceCtaExchangeDrawer = DefaultFeature;
export type PtxServiceCtaScreens = DefaultFeature;
export type PortfolioExchangeBanner = DefaultFeature;
export type Objkt = DefaultFeature;
export type EditEthTx = DefaultFeature;
export type ProtectServicesDiscoverDesktop = DefaultFeature;
export type ListAppsV2 = DefaultFeature;
export type BrazeLearn = DefaultFeature;
export type LlmNewDeviceSelection = DefaultFeature;

/**
 * Utils types.
 */
export type FeatureMap<T = Feature> = { [key in FeatureId]: T };
export type OptionalFeatureMap<T = Feature> = { [key in FeatureId]?: T };
export type FeatureParam<T extends FeatureId> = Features[T]["params"];
