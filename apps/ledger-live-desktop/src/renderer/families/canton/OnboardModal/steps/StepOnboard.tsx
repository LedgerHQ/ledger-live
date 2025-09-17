import BigNumber from "bignumber.js";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getDefaultAccountNameForCurrencyIndex } from "@ledgerhq/live-wallet/accountName";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Spinner from "~/renderer/components/Spinner";
import Text from "~/renderer/components/Text";
import TransactionConfirm from "~/renderer/components/TransactionConfirm";
import logger from "~/renderer/logger";
import { OnboardingData, StepId, StepProps } from "../types";

interface FooterProps {
  currency: CryptoCurrency;
  transitionTo: (stepId: StepId) => void;
  onboardingCompleted: boolean;
  isProcessing: boolean;
  status?: OnboardStatus;
  startOnboarding?: () => void;
}

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

/**
 * Get user-friendly status message for onboarding status
 * @param status - The current onboarding status
 * @returns Human-readable status message
 */
const getStatusMessage = (status: OnboardStatus): string => {
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
  signingData,
  setOnboardingData,
  setOnboardingCompleted,
  error,
  clearError,
}: StepProps) {
  const [statusMessage, setStatusMessage] = useState("");
  const [_retryCount, setRetryCount] = useState(0);

  const resetState = useCallback(() => {
    setStatusMessage("Starting Canton onboarding...");
  }, []);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    setOnboardingData?.(null as unknown as OnboardingData);
    setOnboardingCompleted?.(false);
    setStatusMessage("Ready to start Canton onboarding");
  }, [setOnboardingData, setOnboardingCompleted]);

  useEffect(() => {
    setStatusMessage(getStatusMessage(onboardingStatus as OnboardStatus));
  }, [onboardingStatus]);

  const handleRetry = useCallback(() => {
    clearError();
    resetState();
    retry();
  }, [clearError, resetState, retry]);

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

      case OnboardStatus.PREPARE:
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
                {statusMessage}
              </Box>
            </LoadingRow>
          </Box>
        );

      case OnboardStatus.SIGN:
        if (!device) {
          return (
            <LoadingRow>
              <Spinner color="palette.text.shade60" size={16} />
            </LoadingRow>
          );
        }

        return (
          <TransactionConfirm
            device={device}
            account={creatableAccount!}
            parentAccount={null}
            transaction={
              {
                family: "canton",
                mode: "onboarding",
                recipient: signingData?.partyId || "",
                amount: new BigNumber(0),
                fee: new BigNumber(0),
                onboardingData: signingData,
              } as Transaction
            }
            status={
              {
                amount: new BigNumber(0),
                totalSpent: new BigNumber(0),
                estimatedFees: new BigNumber(0),
                errors: {},
                warnings: {},
              } as TransactionStatus
            }
            manifestId="canton-onboarding"
            manifestName="Canton Onboarding"
          />
        );

      case OnboardStatus.SUBMIT:
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
                {statusMessage}
              </Box>
            </LoadingRow>
          </Box>
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

      case OnboardStatus.ERROR:
        return (
          <Box>
            <Alert type="error" mb={4}>
              {error && <Text mt={2}>{error.message}</Text>}
            </Alert>

            <Button primary onClick={handleRetry}>
              <Trans i18nKey="common.retry">Retry</Trans>
            </Button>
          </Box>
        );

      default:
        return <></>;
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
  startOnboarding,
}: FooterProps) => {
  const handleNext = useCallback(() => {
    logger.log("[StepOnboardFooter] Continue button clicked:", {
      onboardingCompleted,
      isProcessing,
      status,
      startOnboarding: !!startOnboarding,
    });

    if (status === OnboardStatus.INIT) {
      logger.log("StepOnboard: Starting onboarding process via parent");
      startOnboarding?.();
    } else if (onboardingCompleted && !isProcessing) {
      logger.log("StepOnboard: Transitioning to authorization");
      transitionTo(StepId.AUTHORIZE);
    } else {
      logger.warn("StepOnboard: Cannot transition - conditions not met", {
        status,
        startOnboarding: !!startOnboarding,
        onboardingCompleted,
        isProcessing,
      });
    }
  }, [onboardingCompleted, isProcessing, status, startOnboarding, transitionTo]);

  if (status === OnboardStatus.SIGN) {
    return <></>;
  }

  const isButtonDisabled =
    status === OnboardStatus.INIT ? false : isProcessing || !onboardingCompleted;

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      {currency && <CurrencyBadge currency={currency} />}
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
