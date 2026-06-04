import { z } from "zod";
import { flagWith } from "../../define";

const restoreInfoDrawerSchema = z.object({
  enabled: z.boolean(),
  supportLinkURI: z.string(),
});

const onboardingRestoreSchema = z.object({
  restoreInfoDrawer: restoreInfoDrawerSchema,
  postOnboardingURI: z.string(),
});

const managerStatesNewSchema = z.object({
  quickAccessURI: z.string(),
  alreadyOnboardedURI: z.string(),
});

const managerStatesDataSchema = z.object({
  NEW: managerStatesNewSchema,
});

const accountSchema = z.object({
  homeURI: z.string(),
});

export const protectServicesMobile = flagWith(
  {
    deeplink: z.string(),
    bannerSubscriptionNotification: z.boolean(),
    onboardingRestore: onboardingRestoreSchema,
    managerStatesData: managerStatesDataSchema,
    account: accountSchema,
    protectId: z.string(),
  },
  {
    enabled: false,
    params: {
      bannerSubscriptionNotification: false,
      deeplink: "",
      account: {
        homeURI:
          "ledgerlive://recover/protect-simu?source=llm-myledger-access-card&ajs_prop_source=llm-myledger-access-card&ajs_prop_campaign=recover-launch",
      },
      managerStatesData: {
        NEW: {
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
          supportLinkURI: "https://support.ledger.com",
        },
      },
      protectId: "protect-simu",
    },
  },
);
