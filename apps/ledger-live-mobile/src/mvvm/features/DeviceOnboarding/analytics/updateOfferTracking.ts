import type { UpdateOfferEvent } from "@features/flow-device-onboarding-update-offer";
import {
  onboardingButtons,
  onboardingPages,
  trackOnboardingClick,
  trackOnboardingPage,
  type FunnelProps,
  type OnboardingButton,
} from "@features/platform-device-onboarding-analytics";

const buttonByAnswer = {
  offer: { update: onboardingButtons.continue, close: onboardingButtons.close },
  confirmSkip: { update: onboardingButtons.installUpdate, skip: onboardingButtons.skipUpdate },
} as const satisfies Record<string, Partial<Record<string, OnboardingButton>>>;

/** Sends the OS update sheet events of the setup screen as the funnel's pages and clicks. */
export function trackUpdateOfferEvent(event: UpdateOfferEvent, funnelProps: FunnelProps): void {
  const page =
    event.sheet === "offer" ? onboardingPages.osUpdateRequired : onboardingPages.osUpdateRefusal;
  if (event.type === "shown") {
    trackOnboardingPage(page, funnelProps);
    return;
  }
  const buttons: Partial<Record<typeof event.button, OnboardingButton>> =
    buttonByAnswer[event.sheet];
  const button = buttons[event.button];
  // A sheet that comes back after another sheet is not the current page: name it.
  if (button) trackOnboardingClick(button, funnelProps, { page });
}
