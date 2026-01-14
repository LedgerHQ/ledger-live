import React from "react";
import { WelcomeNew as WelcomeNewMVVM } from "LLD/features/Onboarding/screens/WelcomeNew";
import { WelcomeOld } from "./WelcomeOld";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export function Welcome() {
  const welcomeScreenVideoCarouselFeature = useFeature("welcomeScreenVideoCarousel");

  return welcomeScreenVideoCarouselFeature?.enabled ? <WelcomeNewMVVM /> : <WelcomeOld />;
}
