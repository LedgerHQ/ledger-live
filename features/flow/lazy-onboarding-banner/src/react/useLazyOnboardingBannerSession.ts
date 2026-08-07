import { useSyncExternalStore } from "react";
import {
  dismissLazyOnboardingBannerForSession,
  getLazyOnboardingBannerDismissed,
  subscribeToLazyOnboardingBannerSession,
} from "../state/lazyOnboardingBannerSession";

export type LazyOnboardingBannerSession = Readonly<{
  isDismissed: boolean;
  dismiss: () => void;
}>;

export function useLazyOnboardingBannerSession(): LazyOnboardingBannerSession {
  const isDismissed = useSyncExternalStore(
    subscribeToLazyOnboardingBannerSession,
    getLazyOnboardingBannerDismissed,
    getLazyOnboardingBannerDismissed,
  );

  return { isDismissed, dismiss: dismissLazyOnboardingBannerForSession };
}
