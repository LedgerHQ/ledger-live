import { Button, Flex } from "@ledgerhq/react-ui";
import React from "react";
import { Trans } from "react-i18next";
import { AccountOnboardStatus, StepId, StepProps } from "./types";

export const StepOnboardFooter = ({
  isProcessing,
  onboardingStatus,
  onOnboardAccount,
  onRetryOnboardAccount,
  transitionTo,
}: StepProps) => {
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
  onAddAccounts,
  onAddMore,
  isReonboarding,
  importableAccounts,
  creatableAccount,
  onboardingResult,
}: StepProps) => {
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
      {!isReonboarding && (
        <Button size="large" variant="main" outline onClick={onAddMore}>
          {t("addAccounts.cta.addMore")}
        </Button>
      )}
      <Button size="xl" variant="main" onClick={handleDone}>
        {isReonboarding ? t("common.continue") : t("common.done")}
      </Button>
    </Flex>
  );
};
