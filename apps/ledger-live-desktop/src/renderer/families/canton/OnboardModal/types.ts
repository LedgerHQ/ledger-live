import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { OnboardStatus, AuthorizeStatus } from "@ledgerhq/coin-canton/types";

export type OnboardingResult = {
  partyId: string;
  completedAccount: Account;
};

export enum StepId {
  ONBOARD = "ONBOARD",
  AUTHORIZE = "AUTHORIZE",
  FINISH = "FINISH",
}

export type StepProps = {
  t: TFunction;
  device: Device;
  currency: CryptoCurrency;
  accountName: string;
  editedNames: { [accountId: string]: string };
  creatableAccount: Account;
  importableAccounts: Account[];
  isProcessing: boolean;
  onboardingResult: OnboardingResult | undefined;
  onboardingStatus: OnboardStatus;
  authorizeStatus: AuthorizeStatus;
  error: Error | null;
  onAddAccounts: (accounts: Account[]) => void;
  onAddMore: () => void;
  onAuthorizePreapproval: () => void;
  onOnboardAccount: () => void;
  onRetryOnboardAccount: () => void;
  onRetryPreapproval: () => void;
  transitionTo: (stepId: StepId) => void;
};
