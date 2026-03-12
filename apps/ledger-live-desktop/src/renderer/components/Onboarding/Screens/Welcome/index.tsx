import React from "react";
import { WelcomeNew as WelcomeNewMVVM } from "LLD/features/Onboarding/screens/WelcomeNew";
import { useMarkWalletV4TourSeenAtOnboardingStart } from "LLD/features/WalletV4Tour/hooks/useMarkWalletV4TourSeenAtOnboardingStart";
import { WelcomeOld } from "./WelcomeOld";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export function Welcome() {
  const welcomeScreenVideoCarouselFeature = useFeature("welcomeScreenVideoCarousel");
  useMarkWalletV4TourSeenAtOnboardingStart();

  return welcomeScreenVideoCarouselFeature?.enabled ? <WelcomeNewMVVM /> : <WelcomeOld />;
}
