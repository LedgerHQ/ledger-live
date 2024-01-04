import { DefaultFeature, Feature, Features, FeatureMap } from "@ledgerhq/types-live";
import { reduce } from "lodash";
import { formatToFirebaseFeatureId } from "./firebaseFeatureFlags";

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
  currencyArbitrum: DEFAULT_FEATURE,
  currencyArbitrumGoerli: DEFAULT_FEATURE,
  currencyAstar: DEFAULT_FEATURE,
  currencyAvalancheCChain: DEFAULT_FEATURE,
  currencyAxelar: DEFAULT_FEATURE,
  currencyBase: DEFAULT_FEATURE,
  currencyBaseGoerli: DEFAULT_FEATURE,
  currencyBittorrent: DEFAULT_FEATURE,
  currencyBoba: DEFAULT_FEATURE,
  currencyCoreum: DEFAULT_FEATURE,
  currencyDesmos: DEFAULT_FEATURE,
  currencyDydx: DEFAULT_FEATURE,
  currencyEnergyWeb: DEFAULT_FEATURE,
  currencyEvmosEvm: DEFAULT_FEATURE,
  currencyInjective: DEFAULT_FEATURE,
  currencyInternetComputer: DEFAULT_FEATURE,
  currencyKavaEvm: DEFAULT_FEATURE,
  currencyKlaytn: DEFAULT_FEATURE,
  currencyLukso: DEFAULT_FEATURE,
  currencyMetis: DEFAULT_FEATURE,
  currencyMoonriver: DEFAULT_FEATURE,
  currencyOnomy: DEFAULT_FEATURE,
  currencyOptimism: DEFAULT_FEATURE,
  currencyOptimismGoerli: DEFAULT_FEATURE,
  currencyPersistence: DEFAULT_FEATURE,
  currencyPolygonZkEvm: DEFAULT_FEATURE,
  currencyPolygonZkEvmTestnet: DEFAULT_FEATURE,
  currencyQuicksilver: DEFAULT_FEATURE,
  currencyRsk: DEFAULT_FEATURE,
  currencySecretNetwork: DEFAULT_FEATURE,
  currencySeiNetwork: DEFAULT_FEATURE,
  currencyStacks: DEFAULT_FEATURE,
  currencyStargaze: DEFAULT_FEATURE,
  currencySyscoin: DEFAULT_FEATURE,
  currencyTelosEvm: DEFAULT_FEATURE,
  currencyUmee: DEFAULT_FEATURE,
  currencyVechain: DEFAULT_FEATURE,
  currencyVelasEvm: DEFAULT_FEATURE,
  currencyCasper: DEFAULT_FEATURE,
  currencyNeonEvm: DEFAULT_FEATURE,
};

/**
 * Default Features.
 */
export const DEFAULT_FEATURES: Features = {
  ...CURRENCY_DEFAULT_FEATURES,

  brazeLearn: DEFAULT_FEATURE,
  objkt: DEFAULT_FEATURE,
  portfolioExchangeBanner: DEFAULT_FEATURE,
  postOnboardingAssetsTransfer: DEFAULT_FEATURE,
  postOnboardingClaimNft: DEFAULT_FEATURE,
  syncOnboarding: DEFAULT_FEATURE,
  walletConnectEntryPoint: DEFAULT_FEATURE,
  counterValue: DEFAULT_FEATURE,
  llmNewDeviceSelection: DEFAULT_FEATURE,
  llmNewFirmwareUpdateUx: DEFAULT_FEATURE,
  mockFeature: DEFAULT_FEATURE,
  multibuyNavigation: DEFAULT_FEATURE,
  ptxServiceCtaExchangeDrawer: DEFAULT_FEATURE,
  ptxServiceCtaScreens: DEFAULT_FEATURE,
  customImage: DEFAULT_FEATURE,
  referralProgramDesktopBanner: DEFAULT_FEATURE,
  disableNftLedgerMarket: DEFAULT_FEATURE,
  disableNftRaribleOpensea: DEFAULT_FEATURE,
  disableNftSend: DEFAULT_FEATURE,
  staxWelcomeScreen: DEFAULT_FEATURE,
  protectServicesDiscoverDesktop: DEFAULT_FEATURE,
  llmWalletQuickActions: DEFAULT_FEATURE,
  listAppsV2minor1: DEFAULT_FEATURE,
  flexibleContentCards: DEFAULT_FEATURE,
  ethStakingProviders: initFeature(),
  referralProgramDiscoverCard: initFeature(),
  newsfeedPage: initFeature(),
  ptxEarn: initFeature(),
  swapWalletApiPartnerList: initFeature(),
  stakePrograms: initFeature(),
  learn: initFeature(),
  receiveStakingFlowConfigDesktop: initFeature(),
  brazePushNotifications: initFeature(),
  walletNftGallery: initFeature(),
  stakeAccountBanner: initFeature(),

  buyDeviceFromLive: {
    enabled: false,
    params: { debug: false, url: null },
  },

  depositNetworkBannerMobile: {
    enabled: false,
    params: { url: "https://www.ledger.com/ledger-live" },
  },

  depositWithdrawBannerMobile: {
    enabled: false,
    params: { url: "https://www.ledger.com/ledger-live" },
  },

  deviceInitialApps: {
    enabled: false,
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

  referralProgramMobile: {
    enabled: false,
    params: { path: "/discover/refer-a-friend" },
  },

  protectServicesDesktop: {
    enabled: false,
    params: {
      availableOnDesktop: false,
      isNew: false,
      ledgerliveStorageState: false,
      bannerSubscriptionNotification: false,
      account: {
        homeURI:
          "ledgerlive://recover/protect-simu?redirectTo=account&source=lld-sidebar-navigation&ajs_recover_source=lld-sidebar-navigation&ajs_recover_campaign=recover-launch",
        loginURI:
          "ledgerlive://recover/protect-simu?redirectTo=login&source=lld-welcome-login&ajs_recover_source=lld-welcome-login&ajs_recover_campaign=recover-launch",
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
          manualStepsURI:
            "https://support.ledger.com/hc/en-us/articles/360013349800-Update-Ledger-Nano-X-firmware?docs=true",
          supportLinkURI: "https://support.ledger.com",
        },
      },
      openRecoverFromSidebar: true,
      protectId: "protect-simu",
    },
  },

  storyly: {
    enabled: true,
    params: {
      stories: {
        recoverySeed: {
          testingEnabled: false,
          instanceId: "14829",
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTQ4Mjl9.iak4gUnizDdPrEXJEV3wszzJ2YkYX-RIWDXv31aJkiE",
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
          "ledgerlive://recover/protect-simu?redirectTo=account&source=llm-myledger-access-card&ajs_prop_source=llm-myledger-access-card&ajs_prop_campaign=recover-launch",
        loginURI:
          "ledgerlive://recover/protect-simu?redirectTo=login&source=llm-myledger-access-card&ajs_prop_source=llm-myledger-access-card&ajs_prop_campaign=recover-launch",
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
          manualStepsURI:
            "https://support.ledger.com/hc/en-us/articles/360013349800-Update-Ledger-Nano-X-firmware?docs=true",
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

  cexDepositEntryPointsDesktop: {
    enabled: false,
    params: {
      path: "/platform/ledger-cex-deposit",
      locations: {
        selectCrypto: true,
      },
    },
  },

  cexDepositEntryPointsMobile: {
    enabled: false,
    params: {
      path: "/discover/ledger-cex-deposit",
      locations: {
        selectCrypto: true,
      },
    },
  },

  fetchAdditionalCoins: {
    enabled: false,
  },

  ptxSwapLiveApp: {
    enabled: false,
  },

  ptxSwapMoonpayProvider: DEFAULT_FEATURE,
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
