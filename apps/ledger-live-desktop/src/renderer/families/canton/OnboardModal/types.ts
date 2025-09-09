import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";

export type Data = {
  currency: CryptoCurrency;
  device: Device;
  selectedAccounts: Account[];
  editedNames: Record<string, string>;
};

export type OnboardingData = {
  partyId: string;
  address: string;
  publicKey: string;
  device: string;
  accountIndex: number;
  currency: string;
  accountName: string;
  transactionHash: string;
  completedAccount: Account;
};

export enum StepId {
  AUTHORIZE,
  ONBOARD,
  FINISH,
}

export type StepProps = {
  t: TFunction;
  accountName: string;
  addAccountsAction: typeof addAccountsAction;
  cantonBridge: CantonCurrencyBridge;
  clearError: () => void;
  closeModal: (modalName: string) => void;
  currency: CryptoCurrency;
  device: Device | null | undefined;
  editedNames: Record<string, string>;
  error: Error | null;
  existingAccounts: Account[];
  onAccountCreated: (account: Account) => void;
  onboardingCompleted?: boolean;
  onboardingData?: OnboardingData | null;
  onboardingStatus?: OnboardStatus;
  selectedAccounts: Account[];
  setError: (error: Error | null) => void;
  setOnboardingCompleted?: (completed: boolean) => void;
  setOnboardingData?: (data: OnboardingData) => void;
  setOnboardingStatus?: (status: OnboardStatus) => void;
  transitionTo: (stepId: StepId) => void;
};
