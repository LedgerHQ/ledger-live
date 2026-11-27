import { parseExtraFeatureFlags } from "@ledgerhq/live-e2e-shared/featureFlagsJsonUtils";

import type { PartialFeatures } from "@shared/feature-flags";

const FF_ACCOUNT_DETAIL = {
  accountDetail: { enabled: true },
} satisfies PartialFeatures;

export const isAccountDetailEnabled = () => globalThis.mergedFeatureFlags?.accountDetail?.enabled;

export const FF_PASSWORD_REVAMP = {
  lwmPasswordRevamp: { enabled: true },
} satisfies PartialFeatures;

export const FF_BORROW_ENABLED = {
  ptxBorrowLiveApp: {
    enabled: true,
    params: { manifest_id: "borrow" },
  },
  largeScreenUpsell: { enabled: false },
} satisfies PartialFeatures;

export const FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED = {
  newSendFlowFirstInteractionBanner: { enabled: true },
} satisfies PartialFeatures;

export const FF_LWM_CONTACTS_ENABLED = {
  lwmContacts: {
    enabled: true,
    params: { newBadge: false, eligibleAddressFamilies: ["evm", "tron"] },
  },
} satisfies PartialFeatures;

export const FF_NEW_SEND_FLOW_ENABLED = {
  newSendFlow: {
    enabled: true,
    params: {
      families: ["cosmos", "polkadot", "evm", "algorand", "solana", "tron", "stellar", "xrp"],
      excludedCurrencyIds: [],
    },
  },
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} satisfies PartialFeatures;

// Disable new send flow to avoid the new send flow on legacy send flow tests.
export const FF_DISABLE_NEW_SEND_FLOW: PartialFeatures = {
  newSendFlow: {
    enabled: false,
  },
};

// Mina staking is not in the remote stakePrograms list yet, so the account's Earn action would not
// render without this. An empty `redirects` keeps the native Ledger Live flow rather than a partner
// app.
export const FF_MINA_STAKING_ENABLED = {
  stakePrograms: {
    enabled: true,
    params: {
      list: ["mina"],
      redirects: {},
    },
  },
} satisfies PartialFeatures;

export const FF_BABYLON_STAKING_ENABLED = {
  currencyBabylon: { enabled: true },
  stakePrograms: {
    enabled: true,
    params: {
      list: ["babylon"],
      redirects: {},
    },
  },
} satisfies PartialFeatures;

export const FF_TEZOS_STAKING_ENABLED = {
  llmTezosStaking: { enabled: true },
} satisfies PartialFeatures;

export const FF_CONTACTS_ENABLED = {
  lwmContacts: {
    enabled: true,
    params: { newBadge: false, eligibleAddressFamilies: ["evm", "tron"] },
  },
} satisfies PartialFeatures;

export const getMergedFeatureFlags = ({
  testFlags,
}: { testFlags?: PartialFeatures } = {}): PartialFeatures => {
  const ffPresetMap: Record<string, PartialFeatures> = {
    /*
     * The keys here are the values of the `E2E_MOBILE_FEATURE_FLAGS` environment variable.
     * We can add more mappings here in the future to test different feature flag combinations.
     * For the GitHub Actions workflow we can add options and leave the input variable name as is.
     * This will reduce friction and provide CI stability for any callers of the workflow.
     * PLEASE NOTE: non-existing keys will return 'undefined' which spreads to an empty object.
     */
    "account-detail": FF_ACCOUNT_DETAIL,
  };

  const defaultFlags: PartialFeatures = {
    // explicit defaults
    onboardingWidget: {
      enabled: true,
    },
    largeScreenUpsell: { enabled: false },
    releaseTour: { enabled: false },
    brazePushNotifications: { enabled: false },
    ratingsPrompt: { enabled: false },
    accountDetail: { enabled: false },
    // Mirrors the production flag; the stg swap manifest is added because e2e loads it unless PRODUCTION=true.
    llmWalletApiDeviceIntentSign: {
      enabled: true,
      params: {
        variantId: "deviceIntentEnabled",
        enabledManifestIds: [
          "swap-live-app-aws",
          "swap-live-app-stg-aws",
          "earn-prd-eks",
          "borrow",
        ],
      },
    },
    llmModularDrawer: {
      enabled: true,
      params: {
        add_account: true,
        live_app: true,
        live_apps_allowlist: [],
        live_apps_blocklist: ["revoke-cash"],
        receive_flow: false,
        send_flow: false,
        enableModularization: true,
        searchDebounceTime: 300,
        backendEnvironment: "PROD",
      },
    },
    // any flags from env variable (if set)
    ...ffPresetMap[process.env.E2E_MOBILE_FEATURE_FLAGS || ""],
  };

  // parse JSON override flags for any overrides
  const jsonOverrideFlags: PartialFeatures = parseExtraFeatureFlags<PartialFeatures>(
    process.env.E2E_FEATURE_FLAGS_JSON,
  );

  return {
    // use spread to override duplicate keys (last one wins)
    ...defaultFlags,
    ...jsonOverrideFlags,
    ...testFlags,
  };
};
