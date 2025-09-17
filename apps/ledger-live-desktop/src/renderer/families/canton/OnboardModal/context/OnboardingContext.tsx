// External dependencies
import React, { createContext, useContext, ReactNode } from "react";

// Local dependencies
import { OnboardingState, useOnboardingState } from "../hooks/useOnboardingState";
import { OnboardingData, SigningData } from "../types";

/**
 * Context type for the onboarding process
 * Provides state management functions for the onboarding flow
 */
interface OnboardingContextType {
  // State
  state: OnboardingState;

  // Onboarding management
  setOnboardingData: (data: OnboardingData) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setOnboardingStatus: (status: OnboardingState["onboardingStatus"]) => void;

  // Authorization management
  setAuthorizeStatus: (status: OnboardingState["authorizeStatus"]) => void;

  // Transaction management
  setSigningData: (signingData: SigningData) => void;

  // Error management
  setError: (error: Error | null) => void;
  clearError: () => void;

  // UI state management
  setIsProcessing: (isProcessing: boolean) => void;

  // State reset
  resetState: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * Provider component for the onboarding context
 * Wraps components that need access to onboarding state and functions
 *
 * @param children - React children components
 */
export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const onboardingState = useOnboardingState();

  return (
    <OnboardingContext.Provider value={onboardingState}>{children}</OnboardingContext.Provider>
  );
};

/**
 * Hook to access the onboarding context
 * Must be used within an OnboardingProvider
 *
 * @returns The onboarding context value
 * @throws Error if used outside of OnboardingProvider
 */
export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboardingContext must be used within an OnboardingProvider");
  }
  return context;
};
