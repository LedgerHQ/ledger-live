import { DefaultFeatures } from "./types";

export const defaultFeatures: DefaultFeatures = {
  learn: {
    enabled: false,
  },
  pushNotifications: {
    enabled: false,
  },
  buyDeviceFromLive: {
    enabled: false,
    params: {
      url: null,
      debug: false,
    },
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
};
