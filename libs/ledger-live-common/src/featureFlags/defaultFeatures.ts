import type { DefaultFeatures } from "@ledgerhq/types-live";

export const defaultFeatures: DefaultFeatures = {
  learn: {
    enabled: false,
  },
  brazePushNotifications: {
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
  currencyOsmosis: {
    enabled: false,
  },
  currencyFantom: {
    enabled: false,
  },
  currencyMoonbeam: {
    enabled: false,
  },
  currencyCronos: {
    enabled: false,
  },
  currencySongbird: {
    enabled: false,
  },
  currencyFlare: {
    enabled: false,
  },
  currencyOsmosisMobile: {
    enabled: false,
  },
  currencyFantomMobile: {
    enabled: false,
  },
  currencyMoonbeamMobile: {
    enabled: false,
  },
  currencyCronosMobile: {
    enabled: false,
  },
  currencySongbirdMobile: {
    enabled: false,
  },
  currencyFlareMobile: {
    enabled: false,
  },
  deviceInitialApps: {
    enabled: false,
    params: {
      apps: ["Boilerplate", "Boilerplate_2", "Boilerplate_3"],
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
  ratings: {
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
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhY2NfaWQiOjY5NDgsImFwcF9pZCI6MTE0MjIsImluc19pZCI6MTI0ODh9.gFt9c5R8rLsnYpZfoBBchKqo9nEJJs5_G3-i215mTlU",
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
};
