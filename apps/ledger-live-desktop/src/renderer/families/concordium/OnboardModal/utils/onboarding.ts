import {
  AccountOnboardStatus,
  ConcordiumOnboardProgress,
  ConcordiumOnboardResult,
} from "@ledgerhq/coin-concordium/types";
import { Account } from "@ledgerhq/types-live";

export type OnboardingStateUpdate = {
  onboardingStatus: AccountOnboardStatus;
  onboardingResult?: {
    completedAccount: Account;
  };
  isProcessing?: boolean;
};

export function handleOnboardingProgress(
  data: ConcordiumOnboardProgress | ConcordiumOnboardResult,
): OnboardingStateUpdate | null {
  if ("status" in data && data.status === AccountOnboardStatus.SIGN) {
    return {
      onboardingStatus: AccountOnboardStatus.SIGN,
    };
  }

  if ("status" in data && data.status === AccountOnboardStatus.SUBMIT) {
    return {
      onboardingStatus: AccountOnboardStatus.SUBMIT,
    };
  }

  if ("account" in data) {
    return {
      onboardingResult: {
        completedAccount: data.account,
      },
      onboardingStatus: AccountOnboardStatus.SUCCESS,
      isProcessing: false,
    };
  }

  return null;
}
