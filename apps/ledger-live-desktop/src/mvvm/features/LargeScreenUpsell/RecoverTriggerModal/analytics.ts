import { LARGE_SCREEN_UPSELL_UTM } from "@features/flow-large-screen-upsell";
import { track, trackPage } from "~/renderer/analytics/segment";

export const RECOVER_TRIGGER_PAGE_NAME = "Upsell trigger - recover";
export const RECOVER_TRIGGER_CTA_BUTTON = "learn more";
export const RECOVER_TRIGGER_DISMISS_BUTTON = {
  notNow: "not now",
  closeButton: "close button",
  outsideTap: "outside tap",
} as const;

export type RecoverTriggerDismissButton =
  (typeof RECOVER_TRIGGER_DISMISS_BUTTON)[keyof typeof RECOVER_TRIGGER_DISMISS_BUTTON];

export type RecoverTriggerSharedAnalyticsProps = Readonly<{
  deviceModel: "lns";
  personalRecoOptIn: boolean;
  offerType: "none";
  platform: "lwd";
}>;

export function trackRecoverTriggerModalViewed(sharedProps: RecoverTriggerSharedAnalyticsProps) {
  trackPage(
    RECOVER_TRIGGER_PAGE_NAME,
    undefined,
    {
      name: RECOVER_TRIGGER_PAGE_NAME,
      sourceFlow: "recover",
      ...sharedProps,
    },
    true,
    false,
  );
}

export function trackRecoverTriggerCtaClicked(sharedProps: RecoverTriggerSharedAnalyticsProps) {
  track("button_clicked", {
    button: RECOVER_TRIGGER_CTA_BUTTON,
    page: RECOVER_TRIGGER_PAGE_NAME,
    ...sharedProps,
  });
}

export function trackRecoverTriggerDismissClicked(
  button: RecoverTriggerDismissButton,
  sharedProps: RecoverTriggerSharedAnalyticsProps,
) {
  track("button_clicked", {
    button,
    page: RECOVER_TRIGGER_PAGE_NAME,
    ...sharedProps,
  });
}

export function trackRecoverTriggerDeeplinkClicked(
  sharedProps: RecoverTriggerSharedAnalyticsProps,
) {
  track("deeplink_clicked", {
    page: RECOVER_TRIGGER_PAGE_NAME,
    deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
    deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
    deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
    ...sharedProps,
  });
}
