import {
  BasicFeature,
  BrazePushNotifications,
  EthStakingProviders,
  Feature,
  FeatureMap,
  Learn,
  ReceiveStakingFlowConfigDesktop,
  StakePrograms,
  SwapWalletApiPartnerList,
  TransactionsAlerts,
  WalletConnectLiveApp,
  WalletNftGallery,
  PtxEarn,
  Storyly,
  NewsfeedPage,
  ProtectServicesMobile,
  ProtectServicesDesktop,
} from "@ledgerhq/types-live";

const BASIC_FEATURE: Feature<unknown> = {
  enabled: false,
};

export const createDefaultFeature = <T = BasicFeature>(opts?: Feature<T>) => {
  const feature = opts ?? BASIC_FEATURE;
  return feature as Feature<T>;
};

export const DEFAULT_FEATURES = {
  /**
   * @TODO
   */
  currencyArbitrum: BASIC_FEATURE,
  currencyArbitrumGoerli: BASIC_FEATURE,
  currencyAstar: BASIC_FEATURE,
  currencyAvalancheCChain: BASIC_FEATURE,
  currencyAxelar: BASIC_FEATURE,
  currencyBase: BASIC_FEATURE,
  currencyBaseGoerli: BASIC_FEATURE,
  currencyBittorrent: BASIC_FEATURE,
  currencyBoba: BASIC_FEATURE,
  currencyCoreum: BASIC_FEATURE,
  currencyDesmos: BASIC_FEATURE,
  currencyEnergyWeb: BASIC_FEATURE,
  currencyEvmosEvm: BASIC_FEATURE,
  currencyInternetComputer: BASIC_FEATURE,
  currencyKavaEvm: BASIC_FEATURE,
  currencyKlaytn: BASIC_FEATURE,
  currencyMetis: BASIC_FEATURE,
  currencyMoonriver: BASIC_FEATURE,
  currencyOnomy: BASIC_FEATURE,
  currencyOptimism: BASIC_FEATURE,
  currencyOptimismGoerli: BASIC_FEATURE,
  currencyPersistence: BASIC_FEATURE,
  currencyPolygonZkEvm: BASIC_FEATURE,
  currencyPolygonZkEvmTestnet: BASIC_FEATURE,
  currencyQuicksilver: BASIC_FEATURE,
  currencyRsk: BASIC_FEATURE,
  currencySecretNetwork: BASIC_FEATURE,
  currencyStacks: BASIC_FEATURE,
  currencyStargaze: BASIC_FEATURE,
  currencySyscoin: BASIC_FEATURE,
  currencyTelosEvm: BASIC_FEATURE,
  currencyUmee: BASIC_FEATURE,
  currencyVelasEvm: BASIC_FEATURE,

  /**
   * Basic features
   */
  brazeLearn: BASIC_FEATURE,
  objkt: BASIC_FEATURE,
  portfolioExchangeBanner: BASIC_FEATURE,
  postOnboardingAssetsTransfer: BASIC_FEATURE,
  postOnboardingClaimNft: BASIC_FEATURE,
  syncOnboarding: BASIC_FEATURE,
  walletConnectEntryPoint: BASIC_FEATURE,
  counterValue: BASIC_FEATURE,
  listAppsV2: BASIC_FEATURE,
  llmNewDeviceSelection: BASIC_FEATURE,
  llmNewFirmwareUpdateUx: BASIC_FEATURE,
  mockFeature: BASIC_FEATURE,
  multibuyNavigation: BASIC_FEATURE,
  ptxServiceCtaExchangeDrawer: BASIC_FEATURE,
  ptxServiceCtaScreens: BASIC_FEATURE,
  customImage: BASIC_FEATURE,
  referralProgramDesktopBanner: BASIC_FEATURE,
  editEthTx: BASIC_FEATURE,
  disableNftLedgerMarket: BASIC_FEATURE,
  disableNftRaribleOpensea: BASIC_FEATURE,
  disableNftSend: BASIC_FEATURE,
  referralProgramDiscoverCard: BASIC_FEATURE,
  stakeAccountBanner: BASIC_FEATURE,
  staxWelcomeScreen: BASIC_FEATURE,
  protectServicesDiscoverDesktop: BASIC_FEATURE,

  /**
   * Features
   */
  newsfeedPage: createDefaultFeature<NewsfeedPage>(),
  ptxEarn: createDefaultFeature<PtxEarn>(),
  swapWalletApiPartnerList: createDefaultFeature<SwapWalletApiPartnerList>(),
  stakePrograms: createDefaultFeature<StakePrograms>(),
  learn: createDefaultFeature<Learn>(),
  receiveStakingFlowConfigDesktop: createDefaultFeature<ReceiveStakingFlowConfigDesktop>(),
  brazePushNotifications: createDefaultFeature<BrazePushNotifications>(),
  depositNetworkBannerMobile: createDefaultFeature({
    enabled: false,
    params: {
      url: "https://www.ledger.com/ledger-live",
    },
  }),
  depositWithdrawBannerMobile: createDefaultFeature({
    enabled: false,
    params: {
      url: "https://www.ledger.com/ledger-live",
    },
  }),
  deviceInitialApps: createDefaultFeature({
    enabled: false,
    params: {
      apps: ["Bitcoin", "Ethereum"],
    },
  }),

  discover: createDefaultFeature({
    enabled: false,
    params: {
      version: "1",
    },
  }),
  domainInputResolution: createDefaultFeature({
    enabled: false,
    params: {
      supportedCurrencyIds: ["ethereum"],
    },
  }),
  ethStakingProviders: createDefaultFeature<EthStakingProviders>({
    enabled: false,
  }),
  firebaseEnvironmentReadOnly: createDefaultFeature({
    enabled: false,
    params: {
      comment:
        "Do not modify this configuration. This is just a read-only helper to display the targeted Firebase environment in Ledger Live. The value of this flag has NO functional impact.",
      project: "n/a (Firebase project could not be reached)",
    },
  }),

  npsRatingsPrompt: createDefaultFeature({
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
  }),

  protectServicesDesktop: createDefaultFeature<ProtectServicesDesktop>({
    enabled: false,
    params: {
      availableOnDesktop: false,
      account: {
        homeURI: "ledgerlive://recover/protect-simu?redirectTo=account",
        loginURI: "ledgerlive://recover/protect-simu?redirectTo=login",
      },
      discoverTheBenefitsLink: "https://www.ledger.com/recover",
      onboardingCompleted: {
        alreadySubscribedURI: "ledgerlive://recover/protect-simu?redirectTo=login",
        upsellURI: "ledgerlive://recover/protect-simu?redirectTo=upsell",
      },
      onboardingRestore: {
        postOnboardingURI: "ledgerlive://recover/protect-simu?redirectTo=restore",
        restoreInfoDrawer: {
          enabled: true,
          manualStepsURI:
            "https://support.ledger.com/hc/en-us/articles/360013349800-Update-Ledger-Nano-X-firmware?docs=true",
          supportLinkURI: "https://support.ledger.com",
        },
      },
      openRecoverFromSidebar: true,
      protectId: "protect-simu",
    },
  }),
  protectServicesMobile: createDefaultFeature<ProtectServicesMobile>({
    enabled: false,
    params: {
      deeplink: "",
      login: {
        loginURI: "ledgerlive://recover/protect-simu?redirectTo=login",
      },
      managerStatesData: {
        NEW: {
          alreadySubscribedURI: `ledgerlive://recover/protect-simu?redirectTo=login`,
          learnMoreURI: `ledgerlive://recover/protect-simu?redirectTo=upsell`,
        },
      },
      onboardingRestore: {
        postOnboardingURI: `ledgerlive://recover/protect-simu?redirectTo=restore`,
        restoreInfoDrawer: {
          enabled: true,
          manualStepsURI:
            "https://support.ledger.com/hc/en-us/articles/360013349800-Update-Ledger-Nano-X-firmware?docs=true",
          supportLinkURI:
            "http://chat.abhishekpriyam.com/sprinklrlivechatv2.php?appId=63453067138a3f453db323b4_app_300078397&env=prod3",
        },
      },
      protectId: "protect-simu",
    },
  }),

  ratingsPrompt: createDefaultFeature({
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
  }),

  referralProgramDesktopSidebar: createDefaultFeature({
    enabled: false,
    params: {
      amount: "$20",
      isNew: true,
      path: "/discover/refer-a-friend",
    },
  }),
  referralProgramMobile: createDefaultFeature({
    enabled: false,
    params: {
      path: "/discover/refer-a-friend",
    },
  }),

  storyly: createDefaultFeature<Storyly>({
    enabled: true,
    params: {
      stories: {
        recoverySeed: {
          testingEnabled: false,
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTQ4Mjl9.iak4gUnizDdPrEXJEV3wszzJ2YkYX-RIWDXv31aJkiE",
        },
        storylyExample: {
          testingEnabled: false,
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjc2MCwiYXBwX2lkIjo0MDUsImluc19pZCI6NDA0fQ.1AkqOy_lsiownTBNhVOUKc91uc9fDcAxfQZtpm3nj40",
        },
        testStory: {
          testingEnabled: false,
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTIxOTh9.XqNitheri5VPDqebtA4JFu1VucVOHYlryki2TqCb1DQ",
        },
      },
    },
  }),

  transactionsAlerts: createDefaultFeature<TransactionsAlerts>({
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
  }),
  buyDeviceFromLive: createDefaultFeature({
    enabled: false,
    params: {
      debug: false,
      url: null,
    },
  }),
  walletConnectLiveApp: createDefaultFeature<WalletConnectLiveApp>(),
  walletNftGallery: createDefaultFeature<WalletNftGallery>(),
} as const satisfies FeatureMap;
