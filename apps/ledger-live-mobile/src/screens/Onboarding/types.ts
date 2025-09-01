export type Step = {
  id: string;
  isGhost?: boolean;
};
export type OnboardingContextType = {
  setFirstTimeOnboarding: (_: boolean) => void;

  syncNavigation: (routeName: string) => void;
  // reset to step 0 of current mode
  resetCurrentStep: () => void;
};

export type OnboardingContextProviderProps = {
  children: React.ReactNode;
};
