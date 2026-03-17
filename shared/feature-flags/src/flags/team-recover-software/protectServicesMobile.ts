import { z } from "zod";
import { flagWith } from "../../define";

const compatibleDeviceSchema = z.object({
  available: z.boolean(),
  comingSoon: z.boolean(),
  name: z.string(),
});

const restoreInfoDrawerSchema = z.object({
  enabled: z.boolean(),
  manualStepsURI: z.string(),
  supportLinkURI: z.string(),
});

const onboardingRestoreSchema = z.object({
  restoreInfoDrawer: restoreInfoDrawerSchema,
  postOnboardingURI: z.string(),
});

const managerStatesNewSchema = z.object({
  learnMoreURI: z.string(),
  alreadySubscribedURI: z.string(),
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
    ledgerliveStorageState: z.boolean(),
    bannerSubscriptionNotification: z.boolean(),
    compatibleDevices: z.array(compatibleDeviceSchema),
    onboardingRestore: onboardingRestoreSchema,
    managerStatesData: managerStatesDataSchema,
    account: accountSchema,
    protectId: z.string(),
  },
  {
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
          supportLinkURI: "https://support.ledger.com",
        },
      },
      protectId: "protect-simu",
    },
  },
);
