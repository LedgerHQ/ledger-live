// External dependencies
import { useState, useCallback } from "react";
import { OnboardStatus, PreApprovalStatus } from "@ledgerhq/coin-canton/types";

// Local types
import { OnboardingData, SigningData } from "../types";

/**
 * State interface for the onboarding process
 */
export interface OnboardingState {
  // Step management
  stepId: string;

  // Account information
  accountName: string;
  isCreating: boolean;

  // Error handling
  error: Error | null;

  // Onboarding process
  onboardingData: OnboardingData | null;
  onboardingCompleted: boolean;
  onboardingStatus: OnboardStatus;

  // Authorization process
  authorizeStatus: PreApprovalStatus;

  // Transaction data
  signingData: SigningData | null;

  // UI state
  isProcessing: boolean;
  showConfirmation: boolean;
  progress: number;
  message: string;

  // Subscriptions
  preapprovalSubscription: { unsubscribe: () => void } | null;
}

/**
 * Custom hook for managing Canton onboarding state
 * Provides state management and helper functions for the onboarding process
 *
 * @returns Object containing state and state management functions
 */
export const useOnboardingState = () => {
  const [state, setState] = useState<OnboardingState>({
    stepId: "ONBOARD",
    accountName: "",
    isCreating: false,
    error: null,
    onboardingData: null,
    onboardingCompleted: false,
    onboardingStatus: OnboardStatus.INIT,
    authorizeStatus: PreApprovalStatus.INIT,
    signingData: null,
    isProcessing: false,
    showConfirmation: false,
    progress: 0,
    message: "",
    preapprovalSubscription: null,
  });

  /**
   * Updates the state with partial updates
   * @param updates - Partial state updates to apply
   */
  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setOnboardingData = useCallback(
    (data: OnboardingData) => {
      updateState({ onboardingData: data });
    },
    [updateState],
  );

  const setOnboardingCompleted = useCallback(
    (completed: boolean) => {
      updateState({ onboardingCompleted: completed });
    },
    [updateState],
  );

  const setOnboardingStatus = useCallback(
    (status: OnboardStatus) => {
      updateState({ onboardingStatus: status });
    },
    [updateState],
  );

  const setAuthorizeStatus = useCallback(
    (status: PreApprovalStatus) => {
      updateState({ authorizeStatus: status });
    },
    [updateState],
  );

  const setSigningData = useCallback(
    (signingData: SigningData) => {
      updateState({ signingData });
    },
    [updateState],
  );

  const setError = useCallback(
    (error: Error | null) => {
      updateState({ error });
    },
    [updateState],
  );

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const setIsProcessing = useCallback(
    (isProcessing: boolean) => {
      updateState({ isProcessing });
    },
    [updateState],
  );

  const resetState = useCallback(() => {
    setState({
      stepId: "ONBOARD",
      accountName: "",
      isCreating: false,
      error: null,
      onboardingData: null,
      onboardingCompleted: false,
      onboardingStatus: OnboardStatus.INIT,
      authorizeStatus: PreApprovalStatus.INIT,
      signingData: null,
      isProcessing: false,
      showConfirmation: false,
      progress: 0,
      message: "",
      preapprovalSubscription: null,
    });
  }, []);

  return {
    state,
    updateState,
    setOnboardingData,
    setOnboardingCompleted,
    setOnboardingStatus,
    setAuthorizeStatus,
    setSigningData,
    setError,
    clearError,
    setIsProcessing,
    resetState,
  };
};
