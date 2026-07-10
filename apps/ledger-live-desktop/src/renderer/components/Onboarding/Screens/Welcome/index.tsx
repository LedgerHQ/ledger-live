import React from "react";
import { Welcome as WelcomeMVVM } from "LLD/features/Onboarding/screens/Welcome";
import { useMarkWalletV4TourSeenAtOnboardingStart } from "LLD/features/WalletV4Tour/hooks/useMarkWalletV4TourSeenAtOnboardingStart";
import { useMarkQ2TourSeenAtOnboardingStart } from "LLD/features/Q2Tour/hooks/useMarkQ2TourSeenAtOnboardingStart";

export function Welcome() {
  useMarkWalletV4TourSeenAtOnboardingStart();
  useMarkQ2TourSeenAtOnboardingStart();

  return <WelcomeMVVM />;
}
