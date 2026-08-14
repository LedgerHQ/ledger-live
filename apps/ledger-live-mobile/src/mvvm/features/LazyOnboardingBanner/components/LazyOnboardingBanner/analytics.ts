import { track } from "~/analytics";

export const trackLazyOnboardingBannerPressed = () => {
  track("button_clicked", {
    button: "Product tour lazy onboarding",
    page: "Wallet",
  });
};

export const trackLazyOnboardingBannerDismissed = () => {
  track("button_clicked", {
    button: "Dismiss",
    page: "Wallet",
    banner: "Lazy onboarding banner",
  });
};
