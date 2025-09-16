import React, { createContext, useContext, ReactNode } from "react";
import { OnboardingState, useOnboardingState } from "../hooks/useOnboardingState";
import { OnboardingData, SigningData } from "../types";

interface OnboardingContextType {
  state: OnboardingState;
  setOnboardingData: (data: OnboardingData) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setOnboardingStatus: (status: OnboardingState["onboardingStatus"]) => void;
  setAuthorizeStatus: (status: OnboardingState["authorizeStatus"]) => void;
  setSigningData: (signingData: SigningData) => void;
  setError: (error: Error | null) => void;
  clearError: () => void;
  setIsProcessing: (isProcessing: boolean) => void;
  resetState: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const onboardingState = useOnboardingState();

  return (
    <OnboardingContext.Provider value={onboardingState}>{children}</OnboardingContext.Provider>
  );
};

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboardingContext must be used within an OnboardingProvider");
  }
  return context;
};
