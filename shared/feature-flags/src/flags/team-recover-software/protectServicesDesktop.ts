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

const onboardingCompletedSchema = z.object({
  upsellURI: z.string(),
  restore24URI: z.string(),
  alreadySubscribedURI: z.string(),
  alreadyDeviceSeededURI: z.string(),
});

const accountSchema = z.object({
  homeURI: z.string(),
});

export const protectServicesDesktop = flagWith(
  {
    openWithDevTools: z.boolean(),
    availableOnDesktop: z.boolean(),
    isNew: z.boolean(),
    openRecoverFromSidebar: z.boolean(),
    discoverTheBenefitsLink: z.string(),
    ledgerliveStorageState: z.boolean(),
    bannerSubscriptionNotification: z.boolean(),
    compatibleDevices: z.array(compatibleDeviceSchema),
    onboardingRestore: onboardingRestoreSchema,
    onboardingCompleted: onboardingCompletedSchema,
    account: accountSchema,
    protectId: z.string(),
  },
  {
    enabled: false,
    params: {
      openWithDevTools: false,
      availableOnDesktop: false,
      isNew: false,
      ledgerliveStorageState: false,
      bannerSubscriptionNotification: false,
      account: {
        homeURI:
          "ledgerlive://recover/protect-simu?source=lld-sidebar-navigation&ajs_recover_source=lld-sidebar-navigation&ajs_recover_campaign=recover-launch",
      },
      compatibleDevices: [],
      discoverTheBenefitsLink: "https://www.ledger.com/recover",
      onboardingCompleted: {
        alreadySubscribedURI:
          "ledgerlive://recover/protect-simu?redirectTo=login",
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
          manualStepsURI: "https://support.ledger.com/article/360013349800-zd",
          supportLinkURI: "https://support.ledger.com",
        },
      },
      openRecoverFromSidebar: true,
      protectId: "protect-simu",
    },
  },
);
