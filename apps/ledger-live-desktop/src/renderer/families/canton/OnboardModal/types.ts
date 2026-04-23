import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import type { NavigationSnapshot } from "../hooks/topologyChangeError";

export type OnboardingResult = {
  partyId: string;
  completedAccount: Account;
};

export enum StepId {
  ONBOARD = "ONBOARD",
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
  error: Error | null;
  isReonboarding?: boolean;
  onAddAccounts: () => void;
  onOnboardAccount: () => void;
  onRetryOnboardAccount: () => void;
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
