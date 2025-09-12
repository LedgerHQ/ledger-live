import React from "react";
import { WelcomeNew } from "./WelcomeNew";
import { WelcomeOld } from "./WelcomeOld";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export function Welcome() {
  const welcomeScreenVideoCarouselFeature = useFeature("welcomeScreenVideoCarousel");

  return welcomeScreenVideoCarouselFeature?.enabled ? <WelcomeNew /> : <WelcomeOld />;
}
