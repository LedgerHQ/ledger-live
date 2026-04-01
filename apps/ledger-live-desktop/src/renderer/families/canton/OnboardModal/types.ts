import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { OnboardStatus, AuthorizeStatus } from "@ledgerhq/coin-canton/types";
import type { NavigationSnapshot } from "../hooks/topologyChangeError";

export type OnboardingResult = {
  partyId: string;
  completedAccount: Account;
};

export enum StepId {
  ONBOARD = "ONBOARD",
  AUTHORIZE = "AUTHORIZE",
  FINISH = "FINISH",
}

// Props received by step components from the Stepper.
// `t` and `transitionTo` are injected by the Stepper component itself.
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
  isReonboarding?: boolean;
  skipPreapprovalStep: boolean;
  onAddAccounts: () => void;
  onAddMore: () => void;
  onAuthorizePreapproval: () => void;
  onOnboardAccount: () => void;
  onRetryOnboardAccount: () => void;
  onRetryPreapproval: () => void;
  transitionTo: (stepId: StepId) => void;
};

// Props passed to OnboardModal from parent (e.g., modal data).
export type UserProps = {
  currency: CryptoCurrency | null;
  editedNames: { [accountId: string]: string };
  selectedAccounts: Account[];
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  navigationSnapshot?: NavigationSnapshot;
};
