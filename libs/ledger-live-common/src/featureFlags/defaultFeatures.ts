import {
  ABTestingVariants,
  DefaultFeature,
  Feature,
  FeatureMap,
  Features,
} from "@ledgerhq/types-live";
import reduce from "lodash/reduce";
import { BUY_SELL_UI_APP_ID } from "../wallet-api/constants";
import { formatToFirebaseFeatureId } from "./firebaseFeatureFlags";
import { DeviceModelId } from "@ledgerhq/types-devices";

/**
 * Default disabled feature.
 */
const DEFAULT_FEATURE: DefaultFeature = {
  enabled: false,
};

/**
 * Util function that create a default feature and type its return.
 *
 * @dev needed for proper type infering.
 *
 * @param opts
 * @returns typed `opts` parameter or the default feature.
 */
export const initFeature = <T>(opts?: Feature<T>) => {
  const feature = opts ?? DEFAULT_FEATURE;
  return feature as Feature<T>;
};

/**
 * Currency Features.
 */
export const CURRENCY_DEFAULT_FEATURES = {
  currencyPolkadot: { enabled: true },
  currencyAleo: DEFAULT_FEATURE,
  currencyAleoTestnet: DEFAULT_FEATURE,
  currencyArbitrum: DEFAULT_FEATURE,
  currencyArbitrumSepolia: DEFAULT_FEATURE,
  currencyAstar: DEFAULT_FEATURE,
  currencyAvalancheCChain: DEFAULT_FEATURE,
  currencyAvalancheCChainFuji: DEFAULT_FEATURE,
  currencyAptos: DEFAULT_FEATURE,
  currencyAptosTestnet: DEFAULT_FEATURE,
  currencyAxelar: DEFAULT_FEATURE,
  currencyBase: DEFAULT_FEATURE,
  currencyBaseSepolia: DEFAULT_FEATURE,
  currencyBittorrent: DEFAULT_FEATURE,
  currencyBoba: DEFAULT_FEATURE,
  currencyCoreum: DEFAULT_FEATURE,
  currencyDesmos: DEFAULT_FEATURE,
  currencyDydx: DEFAULT_FEATURE,
  currencyEnergyWeb: DEFAULT_FEATURE,
  currencyInjective: DEFAULT_FEATURE,
  currencyInternetComputer: DEFAULT_FEATURE,
  currencyBitlayer: DEFAULT_FEATURE,
  currencyKlaytn: DEFAULT_FEATURE,
  currencyKlaytnBaobab: DEFAULT_FEATURE,
  currencyLukso: DEFAULT_FEATURE,
  currencyMetis: DEFAULT_FEATURE,
  currencyMoonriver: DEFAULT_FEATURE,
  currencyOnomy: DEFAULT_FEATURE,
  currencyOptimism: DEFAULT_FEATURE,
  currencyOptimismSepolia: DEFAULT_FEATURE,
  currencyPersistence: DEFAULT_FEATURE,
  currencyPolygonZkEvm: DEFAULT_FEATURE,
  currencyPolygonZkEvmTestnet: DEFAULT_FEATURE,
  currencyQuicksilver: DEFAULT_FEATURE,
  currencyRsk: DEFAULT_FEATURE,
  currencySecretNetwork: DEFAULT_FEATURE,
  currencyStacks: DEFAULT_FEATURE,
  currencyStargaze: DEFAULT_FEATURE,
  currencySyscoin: DEFAULT_FEATURE,
  currencyTelosEvm: DEFAULT_FEATURE,
  currencyUmee: DEFAULT_FEATURE,
  currencyVechain: DEFAULT_FEATURE,
  currencyVelasEvm: DEFAULT_FEATURE,
  currencyCasper: DEFAULT_FEATURE,
  currencyNeonEvm: DEFAULT_FEATURE,
  currencyLinea: DEFAULT_FEATURE,
  currencyLineaSepolia: DEFAULT_FEATURE,
  currencyBlast: DEFAULT_FEATURE,
  currencyBlastSepolia: DEFAULT_FEATURE,
  currencyScroll: DEFAULT_FEATURE,
  currencyScrollSepolia: DEFAULT_FEATURE,
  currencyShape: DEFAULT_FEATURE,
  currencyStory: DEFAULT_FEATURE,
  currencyIcon: DEFAULT_FEATURE,
  currencyTon: DEFAULT_FEATURE,
  currencyEtherlink: DEFAULT_FEATURE,
  currencyZkSync: DEFAULT_FEATURE,
  currencyZkSyncSepolia: DEFAULT_FEATURE,
  currencyMantra: DEFAULT_FEATURE,
  currencyXion: DEFAULT_FEATURE,
  currencyZenrock: DEFAULT_FEATURE,
  currencySonicBlaze: DEFAULT_FEATURE,
  currencySonic: DEFAULT_FEATURE,
  currencySui: DEFAULT_FEATURE,
  currencyMina: DEFAULT_FEATURE,
  currencyBabylon: DEFAULT_FEATURE,
  currencySeiNetworkEvm: DEFAULT_FEATURE,
  currencyBerachain: DEFAULT_FEATURE,
  currencyHyperevm: DEFAULT_FEATURE,
  currencyCantonNetwork: DEFAULT_FEATURE,
  currencyCantonNetworkDevnet: DEFAULT_FEATURE,
  currencyCantonNetworkTestnet: DEFAULT_FEATURE,
  currencyKaspa: DEFAULT_FEATURE,
  currencyEthereumHoodi: DEFAULT_FEATURE,
  currencyCore: DEFAULT_FEATURE,
  currencyWestend: DEFAULT_FEATURE,
  currencyAssetHubPolkadot: DEFAULT_FEATURE,
  currencyAssetHubWestend: DEFAULT_FEATURE,
  currencyMonad: DEFAULT_FEATURE,
  currencyMonadTestnet: DEFAULT_FEATURE,
  currencySomnia: DEFAULT_FEATURE,
  currencyZeroGravity: DEFAULT_FEATURE,
  currencyConcordium: DEFAULT_FEATURE,
  currencyConcordiumTestnet: DEFAULT_FEATURE,
  currencyUnichain: DEFAULT_FEATURE,
  currencyUnichainSepolia: DEFAULT_FEATURE,
};

/**
 * Default Features.
 */
export const DEFAULT_FEATURES: Features = {
  ...CURRENCY_DEFAULT_FEATURES,
  nanoOnboardingFundWallet: DEFAULT_FEATURE,
  welcomeScreenVideoCarousel: DEFAULT_FEATURE,
  portfolioExchangeBanner: DEFAULT_FEATURE,
  postOnboardingAssetsTransfer: DEFAULT_FEATURE,
  counterValue: DEFAULT_FEATURE,
  mockFeature: DEFAULT_FEATURE,
  ptxServiceCtaExchangeDrawer: DEFAULT_FEATURE,
  ptxServiceCtaScreens: DEFAULT_FEATURE,
  ptxSwapReceiveTRC20WithoutTrx: DEFAULT_FEATURE,
  disableNftLedgerMarket: DEFAULT_FEATURE,
  disableNftRaribleOpensea: DEFAULT_FEATURE,
  disableNftSend: DEFAULT_FEATURE,
  flexibleContentCards: DEFAULT_FEATURE,
  ethStakingModalWithFilters: DEFAULT_FEATURE,
  ethStakingProviders: initFeature(),
  newsfeedPage: initFeature(),
  swapWalletApiPartnerList: initFeature(),
  stakePrograms: initFeature({ enabled: false, params: { list: [], redirects: {} } }),
  receiveStakingFlowConfigDesktop: initFeature(),
  brazePushNotifications: initFeature(),
  stakeAccountBanner: initFeature(),
  lldOnboardingEnableSync: initFeature({
    enabled: false,
    params: {
      nanos: false,
      touchscreens: false,
    },
  }),
  mixpanelAnalytics: initFeature({
    enabled: false,
    params: { record_sessions_percent: 100 },
  }),

  ptxSwapDetailedView: initFeature({
    enabled: false,
    params: {
      variant: ABTestingVariants.variantA,
    },
  }),
  buyDeviceFromLive: {
    enabled: false,
    params: { debug: false, url: null },
  },

  deviceInitialApps: {
    enabled: true,
    params: { apps: ["Bitcoin", "Ethereum"] },
  },

  discover: {
    enabled: false,
    params: { version: "1" },
  },

  domainInputResolution: {
    enabled: false,
    params: { supportedCurrencyIds: ["ethereum"] },
  },

  editEvmTx: {
    enabled: false,
    params: { supportedCurrencyIds: ["ethereum"] },
  },

  referralProgramDesktopSidebar: {
    enabled: false,
    params: { amount: "$20", isNew: true, path: "/discover/refer-a-friend" },
  },

  protectServicesDesktop: {
    enabled: false,
    params: {
      openWithDevTools: false,
      availableOnDesktop: false,
      isNew: false,
      ledgerliveStorageState: false,
      bannerSubscriptionNotification: false,
      account: {
        homeURI:
          "ledgerlive://recover/protect-simu?source=lld-sidebar-navigation&ajs_recover_source=lld-sidebar-navigation&ajs_recover_campaign=recover-launch",
      },
      compatibleDevices: [],
      discoverTheBenefitsLink: "https://www.ledger.com/recover",
      onboardingCompleted: {
        alreadySubscribedURI: "ledgerlive://recover/protect-simu?redirectTo=login",
        alreadyDeviceSeededURI:
          "ledgerlive://recover/protect-simu?redirectTo=upsell&source=lld-pairing&ajs_recover_source=lld-pairing&ajs_recover_campaign=recover-launch",
        upsellURI:
          "ledgerlive://recover/protect-simu?redirectTo=upsell&source=lld-onboarding-24&ajs_recover_source=lld-onboarding-24&ajs_recover_campaign=recover-launch",
        restore24URI:
          "ledgerlive://recover/protect-simu?redirectTo=upsell&source=lld-restore-24&ajs_recover_source=lld-restore-24&ajs_recover_campaign=recover-launch",
      },
      onboardingRestore: {
        postOnboardingURI:
          "ledgerlive://recover/protect-simu?redirectTo=restore&source=lld-restore",
        restoreInfoDrawer: {
          enabled: true,
          manualStepsURI: "https://support.ledger.com/article/360013349800-zd",

          supportLinkURI: "https://support.ledger.com",
        },
      },
      openRecoverFromSidebar: true,
      protectId: "protect-simu",
    },
  },
  recoverUpsellPostOnboarding: {
    ...DEFAULT_FEATURE,
    params: {
      deviceIds: [
        DeviceModelId.nanoSP,
        DeviceModelId.nanoX,
        DeviceModelId.stax,
        DeviceModelId.europa,
        DeviceModelId.apex,
      ],
    },
  },

  storyly: {
    enabled: false,
    params: {
      stories: {
        recoverySeed: {
          testingEnabled: false,
          instanceId: "14829",
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTQ4Mjl9.iak4gUnizDdPrEXJEV3wszzJ2YkYX-RIWDXv31aJkiE",
        },
        backupRecoverySeed: {
          testingEnabled: false,
          instanceId: "19768",
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTk3Njh9.cXofdXH2klFGH5PmkzIC5w-dgOMrrma8RpGksi0iMlk",
        },
        storylyExample: {
          testingEnabled: false,
          instanceId: "none",
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjc2MCwiYXBwX2lkIjo0MDUsImluc19pZCI6NDA0fQ.1AkqOy_lsiownTBNhVOUKc91uc9fDcAxfQZtpm3nj40",
        },
        testStory: {
          testingEnabled: false,
          instanceId: "12198",
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTIxOTh9.XqNitheri5VPDqebtA4JFu1VucVOHYlryki2TqCb1DQ",
        },
      },
    },
  },

  transactionsAlerts: {
    enabled: false,
    params: {
      chainwatchBaseUrl: "https://chainwatch.aws.stg.ldg-tech.com/v0",
      networks: [
        {
          chainwatchId: "eth",
          ledgerLiveId: "ethereum",
          nbConfirmations: 1,
        },
      ],
    },
  },

  firebaseEnvironmentReadOnly: {
    enabled: false,
    params: {
      comment:
        "Do not modify this configuration. This is just a read-only helper to display the targeted Firebase environment in Ledger Live. The value of this flag has NO functional impact.",
      project: "n/a (Firebase project could not be reached)",
    },
  },

  npsRatingsPrompt: {
    enabled: false,
    params: {
      conditions: {
        disappointed_delay: {
          seconds: 60,
        },
        minimum_accounts_number: 1,
        minimum_app_starts_number: 0,
        minimum_duration_since_app_first_start: {
          seconds: 0,
        },
        minimum_number_of_app_starts_since_last_crash: 0,
        not_now_delay: {
          seconds: 30,
        },
        satisfied_then_not_now_delay: {
          seconds: 90,
        },
      },
      happy_moments: [
        {
          route_name: "ReceiveVerificationConfirmation",
          timer: 2000,
          type: "on_leave",
        },
        {
          route_name: "ClaimRewardsValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "CosmosClaimRewardsValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "AlgorandClaimRewardsValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "SendValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "MarketDetail",
          timer: 3000,
          type: "on_enter",
        },
      ],
      support_email: "support@ledger.com",
      typeform_url:
        "https://ledger.typeform.com/to/UsbZ0RBk?typeform-medium=embed-sdk&typeform-medium-version=next&typeform-embed=popup-blank&dev=1",
    },
  },

  protectServicesMobile: {
    enabled: false,
    params: {
      ledgerliveStorageState: false,
      bannerSubscriptionNotification: false,
      deeplink: "",
      compatibleDevices: [],
      account: {
        homeURI:
          "ledgerlive://recover/protect-simu?source=llm-myledger-access-card&ajs_prop_source=llm-myledger-access-card&ajs_prop_campaign=recover-launch",
      },
      managerStatesData: {
        NEW: {
          learnMoreURI:
            "ledgerlive://recover/protect-simu?redirectTo=upsell&source=llm-onboarding-24&ajs_prop_source=llm-onboarding-24&ajs_prop_campaign=recover-launch",
          alreadySubscribedURI:
            "ledgerlive://recover/protect-simu?redirectTo=login&source=llm-onboarding-24&ajs_prop_source=llm-onboarding-24&ajs_prop_campaign=recover-launch",
          quickAccessURI:
            "ledgerlive://recover/protect-simu?redirectTo=upsell&source=llm-navbar-quick-access&ajs_prop_source=llm-navbar-quick-access&ajs_prop_campaign=recover-launch",
          alreadyOnboardedURI:
            "ledgerlive://recover/protect-simu?redirectTo=upsell&source=llm-pairing&ajs_prop_source=llm-pairing&ajs_prop_campaign=recover-launch",
        },
      },
      onboardingRestore: {
        postOnboardingURI:
          "ledgerlive://recover/protect-simu?redirectTo=restore&source=llm-restore-24&ajs_prop_source=llm-restore-24&ajs_prop_campaign=recover-launch",
        restoreInfoDrawer: {
          enabled: true,
          manualStepsURI: "https://support.ledger.com/article/360013349800-zd",
          supportLinkURI:
            "http://chat.abhishekpriyam.com/sprinklrlivechatv2.php?appId=63453067138a3f453db323b4_app_300078397&env=prod3",
        },
      },
      protectId: "protect-simu",
    },
  },

  ratingsPrompt: {
    enabled: false,
    params: {
      conditions: {
        disappointed_delay: {
          days: 90,
        },
        minimum_accounts_number: 3,
        minimum_app_starts_number: 3,
        minimum_duration_since_app_first_start: {
          days: 3,
        },
        minimum_number_of_app_starts_since_last_crash: 2,
        not_now_delay: {
          days: 15,
        },
        satisfied_then_not_now_delay: {
          days: 3,
        },
      },
      happy_moments: [
        {
          route_name: "ReceiveConfirmation",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "ClaimRewardsValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "SendValidationSuccess",
          timer: 2000,
          type: "on_enter",
        },
        {
          route_name: "MarketDetail",
          timer: 3000,
          type: "on_enter",
        },
      ],
      support_email: "support@ledger.com",
      typeform_url:
        "https://form.typeform.com/to/Jo7gqcB4?typeform-medium=embed-sdk&typeform-medium-version=next&typeform-embed=popup-blank",
    },
  },

  fetchAdditionalCoins: {
    enabled: false,
  },

  buySellUi: {
    enabled: false,
    params: {
      manifestId: BUY_SELL_UI_APP_ID,
    },
  },

  buySellLoader: {
    enabled: false,
    params: {
      durationMs: 0,
    },
  },

  buySellShortcut: {
    enabled: false,
  },
  ptxCard: DEFAULT_FEATURE,

  ptxSwapLiveApp: {
    enabled: true,
    params: {
      manifest_id: "swap-live-app-demo-3",
    },
  },

  ptxPerpsLiveApp: {
    enabled: false,
    params: {
      manifest_id: "perps-live-app",
    },
  },

  ptxPerpsLiveAppMobile: {
    enabled: false,
    params: {
      manifest_id: "perps-live-app",
    },
  },

  ptxEarnLiveApp: {
    enabled: true,
    params: {
      manifest_id: "earn",
    },
  },

  ptxEarnDrawerConfiguration: {
    enabled: false,
    params: {},
  },

  ptxEarnUi: {
    enabled: false,
    params: {
      value: "v1",
    },
  },

  ptxSwapLiveAppMobile: {
    enabled: false,
    params: {
      manifest_id: "swap-live-app-demo-3",
    },
  },

  ptxSwapLiveAppKycWarning: {
    enabled: false,
  },

  ptxSwapLiveAppOnPortfolio: {
    enabled: false,
  },

  llmAnalyticsOptInPrompt: {
    enabled: false,
    params: {
      variant: ABTestingVariants.variantA,
      entryPoints: ["Onboarding", "Portfolio"],
    },
  },

  lldAnalyticsOptInPrompt: {
    enabled: false,
    params: {
      variant: ABTestingVariants.variantA,
      entryPoints: ["Onboarding", "Portfolio"],
    },
  },

  lldActionCarousel: {
    enabled: false,
    params: {
      variant: ABTestingVariants.variantA,
    },
  },

  ptxSwapMoonpayProvider: DEFAULT_FEATURE,
  ptxSwapExodusProvider: DEFAULT_FEATURE,

  myLedgerDisplayAppDeveloperName: DEFAULT_FEATURE,

  lldChatbotSupport: DEFAULT_FEATURE,
  llmChatbotSupport: DEFAULT_FEATURE,
  lldRefreshMarketData: {
    ...DEFAULT_FEATURE,
    params: {
      refreshTime: 3, //nb minutes
    },
  },
  llmRefreshMarketData: {
    ...DEFAULT_FEATURE,
    params: {
      refreshTime: 3, //nb minutes
    },
  },
  lldWalletSync: {
    ...DEFAULT_FEATURE,
    params: {
      environment: "STAGING",
      watchConfig: {},
      learnMoreLink: "",
    },
  },
  llmWalletSync: {
    ...DEFAULT_FEATURE,
    params: {
      environment: "STAGING",
      watchConfig: {},
      learnMoreLink: "",
    },
  },
  enableAppsBackup: DEFAULT_FEATURE,
  web3hub: DEFAULT_FEATURE,
  llmMemoTag: DEFAULT_FEATURE,
  lldMemoTag: DEFAULT_FEATURE,
  ldmkTransport: {
    ...DEFAULT_FEATURE,
    params: {
      warningVisible: true,
    },
  },
  llCounterValueGranularitiesRates: {
    ...DEFAULT_FEATURE,
    params: {
      daily: 14 * 24 * 60 * 60 * 1000,
      hourly: 2 * 24 * 60 * 60 * 1000,
    },
  },
  llmRebornLP: { ...DEFAULT_FEATURE, params: { variant: ABTestingVariants.variantA } },
  llmAccountListUI: DEFAULT_FEATURE,
  llmLedgerSyncEntryPoints: {
    ...DEFAULT_FEATURE,
    params: {
      manager: true,
      accounts: true,
      settings: true,
      onboarding: true,
      postOnboarding: true,
    },
  },
  lldLedgerSyncEntryPoints: {
    ...DEFAULT_FEATURE,
    params: {
      manager: true,
      accounts: true,
      settings: true,
      onboarding: true,
      postOnboarding: true,
    },
  },
  lwmLedgerSyncOptimisation: DEFAULT_FEATURE,
  lwdLedgerSyncOptimisation: DEFAULT_FEATURE,
  lwmNewWordingOptInNotificationsDrawer: {
    ...DEFAULT_FEATURE,
    params: { variant: ABTestingVariants.variantA },
  },
  lldNanoSUpsellBanners: {
    ...DEFAULT_FEATURE,
    params: {
      opted_in: {
        manager: true,
        accounts: true,
        notification_center: true,
        link: "https://shop.ledger.com/pages/ledger-nano-s-upgrade-program",
        img: "", // TODO
        "%": 20,
      },
      opted_out: {
        manager: true,
        accounts: true,
        notification_center: true,
        portfolio: true,
        link: "https://support.ledger.com/article/Ledger-Nano-S-Limitations?redirect=false",
      },
    },
  },
  llmNanoSUpsellBanners: {
    ...DEFAULT_FEATURE,
    params: {
      opted_in: {
        manager: true,
        accounts: true,
        notification_center: true,
        link: "https://shop.ledger.com/pages/ledger-nano-s-upgrade-program",
        "%": 20,
      },
      opted_out: {
        manager: true,
        accounts: true,
        notification_center: true,
        wallet: true,
        link: "https://support.ledger.com/article/Ledger-Nano-S-Limitations?redirect=false",
      },
    },
  },
  llmThai: DEFAULT_FEATURE,
  lldThai: DEFAULT_FEATURE,
  llmMmkvMigration: {
    ...DEFAULT_FEATURE,
    params: {
      shouldRollback: false,
    },
  },
  lldModularDrawer: {
    ...DEFAULT_FEATURE,
    params: {
      add_account: true,
      live_app: true,
      live_apps_allowlist: [],
      live_apps_blocklist: [],
      receive_flow: true,
      send_flow: true,
      enableModularization: false,
      searchDebounceTime: 500,
      backendEnvironment: "PROD",
      enableDialogDesktop: false,
    },
  },
  llmModularDrawer: {
    ...DEFAULT_FEATURE,
    params: {
      add_account: true,
      live_app: true,
      live_apps_allowlist: [],
      live_apps_blocklist: [],
      receive_flow: true,
      send_flow: true,
      enableModularization: false,
      searchDebounceTime: 500,
      backendEnvironment: "PROD",
    },
  },
  llNftEntryPoint: {
    ...DEFAULT_FEATURE,
    params: {
      opensea: false,
      magiceden: false,
      chains: ["ethereum", "polygon", "base", "arbitrum"],
    },
  },
  ldmkSolanaSigner: DEFAULT_FEATURE,
  ldmkConnectApp: DEFAULT_FEATURE,
  lldNetworkBasedAddAccount: DEFAULT_FEATURE,
  llmDatadog: {
    ...DEFAULT_FEATURE,
    params: {
      batchProcessingLevel: "MEDIUM",
      batchSize: "MEDIUM",
      bundleLogsWithRum: true,
      bundleLogsWithTraces: true,
      longTaskThresholdMs: 0,
      nativeInteractionTracking: false,
      nativeLongTaskThresholdMs: 0,
      nativeViewTracking: false,
      resourceTracingSamplingRate: 0,
      serviceName: "Ledger Live Mobile (default)",
      sessionSamplingRate: 0,
      trackBackgroundEvents: false,
      trackFrustrations: true,
      trackErrors: false,
      trackResources: false,
      trackInteractions: false,
      trackWatchdogTerminations: false,
      uploadFrequency: "AVERAGE",
      vitalsUpdateFrequency: "AVERAGE",
    },
  },
  llmSentry: { enabled: true },
  onboardingIgnoredOsUpdates: {
    ...DEFAULT_FEATURE,
    params: {},
  },
  llmHomescreen: DEFAULT_FEATURE,
  supportDeviceApex: DEFAULT_FEATURE,
  llmSyncOnboardingIncr1: DEFAULT_FEATURE,
  lldSyncOnboardingIncr1: DEFAULT_FEATURE,
  noah: {
    ...DEFAULT_FEATURE,
    params: {
      activeCurrencyIds: [],
    },
  },
  newSendFlow: {
    ...DEFAULT_FEATURE,
    params: {
      families: [],
    },
  },
  cantonSkipPreapprovalStep: DEFAULT_FEATURE,
  zcashShielded: DEFAULT_FEATURE,
  llmNanoOnboardingFundWallet: DEFAULT_FEATURE,
  lldRebornABtest: DEFAULT_FEATURE,
  llmRebornABtest: DEFAULT_FEATURE,
  lifiSolana: DEFAULT_FEATURE,
  llmAnimatedSplashScreen: {
    enabled: true,
    params: {
      ios: true,
      android: true,
    },
  },
  llmOnboardingEnableSync: initFeature({
    enabled: false,
    params: {
      nanos: false,
      touchscreens: false,
    },
  }),
  lwmWallet40: {
    ...DEFAULT_FEATURE,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
      tour: true,
      mainNavigation: true,
      lazyOnboarding: false,
    },
  },
  lwdWallet40: {
    ...DEFAULT_FEATURE,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
      mainNavigation: true,
      tour: true,
      lazyOnboarding: false,
      newReceiveDialog: true,
    },
  },
  addressPoisoningOperationsFilter: {
    ...DEFAULT_FEATURE,
    enabled: true,
    params: {
      families: [
        "evm",
        "tron",
        "solana",
        "xrp",
        "stellar",
        "hedera",
        "algorand",
        "cardano",
        "cosmos",
      ],
    },
  },
};

// Firebase SDK treat JSON values as strings
export const formatDefaultFeatures = (config: FeatureMap) =>
  reduce(
    config,
    (acc, feature, featureId) => ({
      ...acc,
      [formatToFirebaseFeatureId(featureId)]: JSON.stringify(feature),
    }),
    {},
  );
