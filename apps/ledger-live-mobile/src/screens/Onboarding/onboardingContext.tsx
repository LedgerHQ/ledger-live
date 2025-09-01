import React, { createContext, useContext, useEffect, useState } from "react";
import { useIsFocused, useRoute } from "@react-navigation/native";
import getStep from "./steps";
import type { OnboardingContextType, OnboardingContextProviderProps } from "./types";

const INITIAL_CONTEXT: OnboardingContextType = {
  setFirstTimeOnboarding: () => null,
  syncNavigation: () => null,
  resetCurrentStep: () => null,
};

const OnboardingContext = createContext(INITIAL_CONTEXT);

export const OnboardingContextProvider = ({ children }: OnboardingContextProviderProps) => {
  const [firstTimeOnboarding, setFirstTimeOnboarding] = useState(true);
  const [currentStep, setCurrentStep] = useState("OnboardingStepGetStarted");

  // hack to make onboarding provider react to navigation change
  // e.g: it can happen when using native gesture for back
  const syncNavigation = (routeName: string) => {
    if (currentStep !== routeName) {
      setCurrentStep(routeName);
    }
  };

  const resetCurrentStep = () => setCurrentStep(getStep("full", firstTimeOnboarding)[0].id);

  return (
    <OnboardingContext.Provider
      value={{
        setFirstTimeOnboarding,
        syncNavigation,
        resetCurrentStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export function useNavigationInterceptor() {
  const onboardingContext = useContext(OnboardingContext);
  const isFocused = useIsFocused();
  const { name: routeName } = useRoute();

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    onboardingContext.syncNavigation(routeName);
  }, [isFocused, routeName, onboardingContext]);

  return onboardingContext;
}
