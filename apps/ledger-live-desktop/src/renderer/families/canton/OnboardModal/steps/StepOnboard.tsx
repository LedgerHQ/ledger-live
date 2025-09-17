import React, { memo, useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { getDefaultAccountNameForCurrencyIndex } from "@ledgerhq/live-wallet/accountName";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Spinner from "~/renderer/components/Spinner";
import SignMessageConfirm from "~/renderer/components/SignMessageConfirm";
import logger from "~/renderer/logger";
import { StepId, StepProps } from "../types";

export const SectionAccountsStyled = styled(Box)`
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
`;

const SectionAccounts = memo(
  ({
    currency,
    accountName,
    editedNames,
    creatableAccount,
    importableAccounts,
  }: Pick<
    StepProps,
    "currency" | "accountName" | "editedNames" | "creatableAccount" | "importableAccounts"
  >) => {
    return (
      <SectionAccountsStyled>
        {importableAccounts?.length > 0 && (
          <Box mb={4}>
            <Box
              horizontal
              ff="Inter|Bold"
              color="palette.text.shade100"
              fontSize={2}
              textTransform="uppercase"
              mb={3}
            >
              <Trans
                i18nKey="addAccounts.sections.onboarded.title"
                count={importableAccounts?.length}
              >
                Onboarded accounts
              </Trans>
            </Box>
            <Box flow={2}>
              {importableAccounts.map((account, index) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  accountName={
                    editedNames[account.id] ||
                    getDefaultAccountNameForCurrencyIndex({ currency, index })
                  }
                  isDisabled={false}
                  hideAmount={false}
                  isReadonly={true}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box mb={4}>
          <Box
            horizontal
            ff="Inter|Bold"
            color="palette.text.shade100"
            fontSize={2}
            textTransform="uppercase"
            mb={3}
          >
            <Trans i18nKey="addAccounts.sections.onboardedable.title">New account</Trans>
          </Box>
          {creatableAccount && (
            <AccountRow
              account={creatableAccount}
              accountName={accountName}
              isDisabled={false}
              hideAmount={true}
              isReadonly={true}
            />
          )}
        </Box>
      </SectionAccountsStyled>
    );
  },
);

SectionAccounts.displayName = "SectionAccounts";

const getStatusMessage = (status?: OnboardStatus): string => {
  switch (status) {
    case OnboardStatus.INIT:
      return "Ready to start Canton onboarding";
    case OnboardStatus.PREPARE:
      return "Preparing your Canton account...";
    case OnboardStatus.SIGN:
      return "Please confirm the transaction on your Ledger device";
    case OnboardStatus.SUBMIT:
      return "Submitting to Canton network...";
    case OnboardStatus.SUCCESS:
      return "Account created successfully!";
    case OnboardStatus.ERROR:
      return "Onboarding failed";
    default:
      return "Processing...";
  }
};

export default function StepOnboard({
  device,
  onboardingStatus,
  currency,
  accountName,
  editedNames,
  importableAccounts,
  creatableAccount,
}: StepProps) {
  const renderContent = (onboardingStatus?: OnboardStatus) => {
    switch (onboardingStatus) {
      case OnboardStatus.INIT:
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
            />

            <Box>
              <Alert>
                <Trans i18nKey="canton.addAccount.onboard.ready">
                  Set up your new Canton account by clicking Continue
                </Trans>
              </Alert>
            </Box>
          </Box>
        );

      case OnboardStatus.SIGN:
        return (
          <SignMessageConfirm
            device={device!}
            account={creatableAccount!}
            parentAccount={null}
            signMessageRequested={{
              message: "Canton Onboarding",
            }}
          />
        );

      case OnboardStatus.SUCCESS:
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
            />

            <Box>
              <Alert>
                <Trans i18nKey="canton.addAccount.combined.preapproval">
                  Your new Canton account has been created and onboarded.
                </Trans>
              </Alert>
            </Box>
          </Box>
        );

      default:
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
            />

            <LoadingRow>
              <Spinner color="palette.text.shade60" size={16} />
              <Box ml={2} ff="Inter|Regular" color="palette.text.shade60" fontSize={4}>
                {getStatusMessage(onboardingStatus)}
              </Box>
            </LoadingRow>
          </Box>
        );
    }
  };

  return renderContent(onboardingStatus);
}

export const StepOnboardFooter = ({
  currency,
  transitionTo,
  onboardingCompleted,
  isProcessing,
  status,
  onOnboardAccount,
}: StepProps) => {
  const handleNext = useCallback(() => {
    logger.log("[StepOnboardFooter] Continue button clicked:", {
      onboardingCompleted,
      isProcessing,
      status,
      onOnboardAccount: !!onOnboardAccount,
    });

    if (status === OnboardStatus.INIT) {
      logger.log("StepOnboard: Starting onboarding process via parent");
      onOnboardAccount();
    } else if (onboardingCompleted && !isProcessing) {
      logger.log("StepOnboard: Transitioning to authorization");
      transitionTo(StepId.AUTHORIZE);
    } else {
      logger.warn("StepOnboard: Cannot transition - conditions not met", {
        status,
        onOnboardAccount: !!onOnboardAccount,
        onboardingCompleted,
        isProcessing,
      });
    }
  }, [onboardingCompleted, isProcessing, status, onOnboardAccount, transitionTo]);

  const isButtonDisabled =
    status === OnboardStatus.INIT ? false : isProcessing || !onboardingCompleted;

  if (status === OnboardStatus.SIGN) {
    return <></>;
  }

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <CurrencyBadge currency={currency} />
      <Button primary disabled={isButtonDisabled} onClick={handleNext}>
        <Trans i18nKey="common.continue" />
      </Button>
    </Box>
  );
};

const LoadingRow = styled(Box).attrs(() => ({
  horizontal: true,
  borderRadius: 1,
  px: 3,
  alignItems: "center",
  justifyContent: "center",
  mt: 1,
}))`
  height: 48px;
  border: 1px dashed ${p => p.theme.colors.palette.text.shade60};
`;
