import type { DefaultFeatures } from "@ledgerhq/types-live";

export const defaultFeatures: DefaultFeatures = {
  learn: {
    enabled: false,
  },
  brazePushNotifications: {
    enabled: false,
  },
  brazeLearn: {
    enabled: false,
  },
  deviceLocalization: {
    enabled: false,
  },
  buyDeviceFromLive: {
    enabled: false,
    params: {
      url: null,
      debug: false,
    },
  },
  currencyAvalancheCChain: {
    enabled: false,
  },
  deviceInitialApps: {
    enabled: false,
    params: {
      apps: ["Bitcoin", "Ethereum", "Polygon"],
    },
  },
  disableNftSend: {
    enabled: false,
  },
  disableNftLedgerMarket: {
    enabled: false,
  },
  disableNftRaribleOpensea: {
    enabled: false,
  },
  domainInputResolution: {
    enabled: false,
    params: {
      supportedCurrencyIds: ["ethereum"],
    },
  },
  ratingsPrompt: {
    enabled: false,
    params: {
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
      conditions: {
        not_now_delay: {
          days: 15,
        },
        disappointed_delay: {
          days: 90,
        },
        satisfied_then_not_now_delay: {
          days: 3,
        },
        minimum_accounts_number: 3,
        minimum_app_starts_number: 3,
        minimum_duration_since_app_first_start: {
          days: 3,
        },
        minimum_number_of_app_starts_since_last_crash: 2,
      },
      typeform_url:
        "https://form.typeform.com/to/Jo7gqcB4?typeform-medium=embed-sdk&typeform-medium-version=next&typeform-embed=popup-blank",
      support_email: "support@ledger.com",
    },
  },
  counterValue: {
    enabled: false,
  },
  llmNewDeviceSelection: {
    enabled: false,
  },
  llmUsbFirmwareUpdate: {
    enabled: false,
  },
  ptxSmartRouting: {
    enabled: false,
  },
  ptxSmartRoutingMobile: {
    enabled: false,
  },
  syncOnboarding: {
    enabled: false,
  },
  mockFeature: {
    enabled: false,
  },
  storyly: {
    enabled: true,
    params: {
      stories: {
        recoverySeed: {
          testingEnabled: false,
          token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTQ4Mjl9.iak4gUnizDdPrEXJEV3wszzJ2YkYX-RIWDXv31aJkiE",
        },
        testStory: {
          testingEnabled: false,
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTIxOTh9.XqNitheri5VPDqebtA4JFu1VucVOHYlryki2TqCb1DQ",
        },
        storylyExample: {
          testingEnabled: false,
          token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjc2MCwiYXBwX2lkIjo0MDUsImluc19pZCI6NDA0fQ.1AkqOy_lsiownTBNhVOUKc91uc9fDcAxfQZtpm3nj40",
        },
      },
    },
  },
  firebaseEnvironmentReadOnly: {
    enabled: false,
    params: {
      project: "n/a (Firebase project could not be reached)",
      comment:
        "Do not modify this configuration. This is just a read-only helper to display the targeted Firebase environment in Ledger Live. The value of this flag has NO functional impact.",
    },
  },
  walletNftGallery: {
    enabled: false,
  },
  walletConnectEntryPoint: {
    enabled: false,
  },
  staxWelcomeScreen: {
    enabled: false,
  },
  customImage: {
    enabled: false,
  },
  postOnboardingClaimNft: {
    enabled: false,
  },
  postOnboardingAssetsTransfer: {
    enabled: false,
  },
  objkt: {
    enabled: false,
  },
  protectServicesMobile: {
    enabled: false,
    params: {
      onboardingRestore: {
        restoreInfoDrawer: {
          enabled: true,
          manualStepsURI:
            "https://support.ledger.com/hc/en-us/articles/360013349800-Update-Ledger-Nano-X-firmware?docs=true",
          supportLinkURI:
            "http://chat.abhishekpriyam.com/sprinklrlivechatv2.php?appId=63453067138a3f453db323b4_app_300078397&env=prod3",
        },
        postOnboardingURI: `ledgerlive://recover/protect-simu?redirectTo=restore`,
      },
      managerStatesData: {
        NEW: {
          learnMoreURI: `ledgerlive://recover/protect-simu?redirectTo=upsell`,
          alreadySubscribedURI: `ledgerlive://recover/protect-simu?redirectTo=login`,
        },
      },
      login: {
        loginURI: "ledgerlive://recover/protect-simu?redirectTo=login",
      },
      protectId: "protect-simu",
    },
  },
  newsfeedPage: {
    enabled: false,
  },
  discover: {
    enabled: false,
    params: {
      version: "1",
    },
  },
  protectServicesDiscoverDesktop: {
    enabled: false,
  },
};
