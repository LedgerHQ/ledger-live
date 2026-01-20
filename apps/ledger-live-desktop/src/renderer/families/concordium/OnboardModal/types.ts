import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import { TFunction } from "i18next";

export type OnboardingResult = {
  completedAccount: Account;
};

export enum StepId {
  ONBOARD = "ONBOARD",
  CREATE = "CREATE",
  FINISH = "FINISH",
}

export type StepProps = {
  accountName: string;
  confirmationCode?: string | null;
  creatableAccount: Account;
  currency: CryptoCurrency;
  device: Device;
  editedNames: { [accountId: string]: string };
  error: Error | null;
  importableAccounts: Account[];
  isPairing: boolean;
  isProcessing: boolean;
  onAddAccounts: () => void;
  onboardingResult: OnboardingResult | undefined;
  onboardingStatus: AccountOnboardStatus;
  onCancel: () => void;
  onComplete: () => void;
  onCreateAccount: () => void;
  onPair: () => void;
  onResendCreateAccount: () => void;
  sessionTopic?: string | null;
  t: TFunction;
  transitionTo: (stepId: StepId) => void;
  walletConnectUri?: string | null;
};
