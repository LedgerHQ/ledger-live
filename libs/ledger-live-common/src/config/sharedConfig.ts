import { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";

export const sharedConfig: ConfigSchema = {
  feature_app_author_name: {
    type: "object",
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
