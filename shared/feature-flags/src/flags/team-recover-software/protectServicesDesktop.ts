import { z } from "zod";
import { flagWith } from "../../define";

const onboardingCompletedSchema = z.object({
  upsellURI: z.string(),
  restore24URI: z.string(),
  alreadyDeviceSeededURI: z.string(),
});

const accountSchema = z.object({
  homeURI: z.string(),
});

export const protectServicesDesktop = flagWith(
  {
    openWithDevTools: z.boolean(),
    availableOnDesktop: z.boolean(),
    openRecoverFromSidebar: z.boolean(),
    discoverTheBenefitsLink: z.string(),
    bannerSubscriptionNotification: z.boolean(),
    onboardingCompleted: onboardingCompletedSchema,
    account: accountSchema,
    protectId: z.string(),
  },
  {
    enabled: false,
    params: {
      openWithDevTools: false,
      availableOnDesktop: false,
      bannerSubscriptionNotification: false,
      account: {
        homeURI:
          "ledgerlive://recover/protect-simu?source=lld-sidebar-navigation&ajs_recover_source=lld-sidebar-navigation&ajs_recover_campaign=recover-launch",
      },
      discoverTheBenefitsLink: "https://www.ledger.com/recover",
      onboardingCompleted: {
        alreadyDeviceSeededURI:
          "ledgerlive://recover/protect-simu?redirectTo=upsell&source=lld-pairing&ajs_recover_source=lld-pairing&ajs_recover_campaign=recover-launch",
        upsellURI:
          "ledgerlive://recover/protect-simu?redirectTo=upsell&source=lld-onboarding-24&ajs_recover_source=lld-onboarding-24&ajs_recover_campaign=recover-launch",
        restore24URI:
          "ledgerlive://recover/protect-simu?redirectTo=upsell&source=lld-restore-24&ajs_recover_source=lld-restore-24&ajs_recover_campaign=recover-launch",
      },
      openRecoverFromSidebar: true,
      protectId: "protect-simu",
    },
  },
);
