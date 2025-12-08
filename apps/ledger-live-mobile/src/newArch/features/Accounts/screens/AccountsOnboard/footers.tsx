import { Button, Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import React from "react";
import { Trans } from "react-i18next";
import { AccountOnboardStatus, DynamicStepProps, StableStepProps, StepId } from "./types";

export const StepOnboardFooter = ({
  onOnboardAccount,
  onRetryOnboardAccount,
  transitionTo,
  onboardingStatus,
  isProcessing,
}: Pick<StableStepProps, "onOnboardAccount" | "onRetryOnboardAccount" | "transitionTo"> &
  Pick<DynamicStepProps, "isProcessing" | "onboardingStatus">) => {
  // During SIGN status, the device action modal handles UI
  if (onboardingStatus === AccountOnboardStatus.SIGN) {
    return null;
  }

  if (onboardingStatus === AccountOnboardStatus.SUCCESS) {
    return (
      <Button type="main" onPress={() => transitionTo(StepId.FINISH)} disabled={isProcessing}>
        <Trans i18nKey="common.continue" />
      </Button>
    );
  }

  if (onboardingStatus === AccountOnboardStatus.ERROR) {
    return (
      <Button type="main" onPress={onRetryOnboardAccount} disabled={isProcessing}>
        <Trans i18nKey="common.tryAgain" />
      </Button>
    );
  }

  return (
    <Button type="main" onPress={onOnboardAccount} disabled={isProcessing}>
      <Trans i18nKey="common.continue" />
    </Button>
  );
};

export const StepFinishFooter = ({
  onAddAccounts,
  importableAccounts,
  isReonboarding,
  onboardingResult,
  isProcessing,
}: Pick<StableStepProps, "onAddAccounts" | "isReonboarding" | "importableAccounts"> &
  Pick<DynamicStepProps, "onboardingResult" | "isProcessing">) => {
  const handleDone = () => {
    const accounts = [...importableAccounts];
    if (onboardingResult?.completedAccount) {
      accounts.push(onboardingResult.completedAccount);
    }
    onAddAccounts(accounts);
  };

  return (
    <Flex flexDirection="column" alignItems="stretch">
      {isProcessing && (
        <Flex alignItems="center" py={2} mb={3}>
          <InfiniteLoader size={20} />
        </Flex>
      )}
      <Button type="main" onPress={handleDone} disabled={isProcessing}>
        <Trans i18nKey={isReonboarding ? "common.continue" : "common.done"} />
      </Button>
    </Flex>
  );
};
