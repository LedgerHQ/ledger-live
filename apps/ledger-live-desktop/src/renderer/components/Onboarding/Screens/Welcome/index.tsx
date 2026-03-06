import React from "react";
import { WelcomeNew as WelcomeNewMVVM } from "LLD/features/Onboarding/screens/WelcomeNew";
import { useMarkWalletV4TourSeenAtOnboardingStart } from "LLD/features/WalletV4Tour/hooks/useMarkWalletV4TourSeenAtOnboardingStart";

export function Welcome() {
  useMarkWalletV4TourSeenAtOnboardingStart();

  // Always show Wallet 4.0 onboarding welcome screen
  return <WelcomeNewMVVM />;
}
