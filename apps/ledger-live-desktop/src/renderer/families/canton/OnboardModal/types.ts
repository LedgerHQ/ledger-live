import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { OnboardStatus, AuthorizeStatus } from "@ledgerhq/coin-canton/types";

export type OnboardingData = {
  completedAccount: Account;
};

export enum StepId {
  ONBOARD = "ONBOARD",
  AUTHORIZE = "AUTHORIZE",
  FINISH = "FINISH",
}

export type StepProps = {
  // Translation
  t: TFunction;

  // Account data
  accountName: string;
  importableAccounts: Account[];
  creatableAccount: Account;
  editedNames: { [accountId: string]: string };

  // Currency and device
  currency: CryptoCurrency;
  device: Device | null | undefined;

  // Modal control
  transitionTo: (stepId: StepId) => void;

  // Account management
  onAddAccounts: (accounts: Account[]) => void;

  // Onboarding state
  onboardingCompleted: boolean;
  onboardingData: OnboardingData | undefined;
  onboardingStatus: OnboardStatus;

  isProcessing: boolean;

  // Actions
  onOnboardAccount: () => void;

  authorizeStatus: AuthorizeStatus;
  onAuthorizePreapproval: () => void;
};
