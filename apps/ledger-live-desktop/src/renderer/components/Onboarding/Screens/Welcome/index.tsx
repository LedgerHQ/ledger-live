import React from "react";
import { Welcome as WelcomeMVVM } from "LLD/features/Onboarding/screens/Welcome";
import { useMarkWalletV4TourSeenAtOnboardingStart } from "LLD/features/WalletV4Tour/hooks/useMarkWalletV4TourSeenAtOnboardingStart";

export function Welcome() {
  useMarkWalletV4TourSeenAtOnboardingStart();

  return <WelcomeMVVM />;
}
