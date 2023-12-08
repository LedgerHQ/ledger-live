import { Config } from "@ledgerhq/live-config";

export const sharedConfig: Config = {
  feature_app_author_name: {
    type: "enabled",
    default: { enabled: false },
  },
  feature_learn: {
    type: "object",
    default: {
      enabled: true,
      params: {
        mobile: {
          url: "https://www-ppr.ledger.com/ledger-live-learn",
        },
        desktop: {
          url: "https://www-ppr.ledger.com/ledger-live-learn",
        },
      },
    },
  },
};
