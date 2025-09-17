// External dependencies
import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";

/**
 * Base data structure for the onboarding modal
 */
export type Data = {
  currency: CryptoCurrency;
  device: Device;
  selectedAccounts: Account[];
  editedNames: {
    [accountId: string]: string;
  };
};

/**
 * Data structure containing the result of the onboarding process
 */
export type OnboardingData = {
  partyId: string;
  address: string;
  publicKey: string;
  device: string;
  accountIndex: number;
  currency: CryptoCurrency;
  accountName: string;
  transactionHash: string;
  completedAccount: Account;
};

/**
 * Enum representing the different steps in the onboarding flow
 */
export enum StepId {
  ONBOARD = "ONBOARD",
  AUTHORIZE = "AUTHORIZE",
  FINISH = "FINISH",
}

/**
 * Data structure for transaction signing information
 */
export interface SigningData {
  partyId: string;
  publicKey: string;
  transactionData: unknown;
  combinedHash: string;
  derivationPath?: string;
}

/**
 * Props interface for step components in the onboarding flow
 */
export type StepProps = {
  // Translation
  t: TFunction;

  // Account data
  accountName: string;
  importableAccounts: Account[];
  creatableAccount: Account;
  selectedAccounts: Account[];
  editedNames: {
    [accountId: string]: string;
  };

  // Currency and device
  currency: CryptoCurrency;
  device: Device | null | undefined;

  // Error handling
  error: Error | null;
  clearError: () => void;

  // Modal control
  closeModal: (modalName: string) => void;
  transitionTo: (stepId: StepId) => void;

  // Account management
  onAddAccounts: (accounts: Account[]) => void;

  // Onboarding state
  onboardingCompleted?: boolean;
  onboardingData?: OnboardingData | null;
  onboardingStatus?: OnboardStatus;
  setOnboardingCompleted?: (completed: boolean) => void;
  setOnboardingData?: (data: OnboardingData) => void;

  // Transaction data
  signingData: SigningData | null;

  // Actions
  startOnboarding?: (() => void) | undefined;
};
