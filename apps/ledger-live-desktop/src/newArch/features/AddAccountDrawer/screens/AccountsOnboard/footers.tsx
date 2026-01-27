import { Button, Flex } from "@ledgerhq/react-ui";
import React from "react";
import { Trans } from "react-i18next";
import { AccountOnboardStatus, DynamicStepProps, StableStepProps, StepId } from "./types";

export const StepOnboardFooter = ({
  onboardingStatus,
  isProcessing,
  onOnboardAccount,
  onRetryOnboardAccount,
  transitionTo,
}: Pick<StableStepProps, "onOnboardAccount" | "onRetryOnboardAccount" | "transitionTo"> &
  Pick<DynamicStepProps, "isProcessing" | "onboardingStatus">) => {
  if (onboardingStatus === AccountOnboardStatus.SIGN) {
    return <></>;
  }

  const handleSuccessTransition = () => {
    transitionTo(StepId.FINISH);
  };

  const renderContent = (onboardingStatus: AccountOnboardStatus) => {
    switch (onboardingStatus) {
      case AccountOnboardStatus.SUCCESS:
        return (
          <Button
            size="xl"
            variant="main"
            disabled={isProcessing}
            onClick={handleSuccessTransition}
            flex={1}
          >
            <Trans i18nKey="common.continue" />
          </Button>
        );
      case AccountOnboardStatus.ERROR:
        return (
          <Button
            size="xl"
            variant="main"
            disabled={isProcessing}
            onClick={onRetryOnboardAccount}
            flex={1}
          >
            <Trans i18nKey="common.tryAgain" />
          </Button>
        );
      default:
        return (
          <Button
            size="xl"
            variant="main"
            disabled={isProcessing}
            onClick={onOnboardAccount}
            flex={1}
          >
            <Trans i18nKey="common.continue" />
          </Button>
        );
    }
  };

  return (
    <Flex flexDirection="row" alignItems="center" justifyContent="flex-end" width="100%">
      {renderContent(onboardingStatus)}
    </Flex>
  );
};

export const StepFinishFooter = ({
  t,
  creatableAccount,
  importableAccounts,
  onAddAccounts,
  onboardingResult,
  isReonboarding,
}: Pick<
  StableStepProps,
  "t" | "onAddAccounts" | "isReonboarding" | "importableAccounts" | "creatableAccount"
> &
  Pick<DynamicStepProps, "onboardingResult">) => {
  const handleDone = () => {
    const accounts = [...importableAccounts];
    if (onboardingResult?.completedAccount) {
      accounts.push(onboardingResult.completedAccount);
    } else if (creatableAccount) {
      accounts.push(creatableAccount);
    }
    onAddAccounts(accounts);
  };

  return (
    <Flex flexDirection="column" width="100%" rowGap="12px">
      <Button size="xl" variant="main" onClick={handleDone}>
        {isReonboarding ? t("common.continue") : t("common.done")}
      </Button>
    </Flex>
  );
};
