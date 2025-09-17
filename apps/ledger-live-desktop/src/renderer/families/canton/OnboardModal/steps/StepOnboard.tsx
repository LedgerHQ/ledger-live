import React, { memo } from "react";
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
import { TransactionConfirm } from "../components/TransactionConfirm";
import { StepId, StepProps } from "../types";

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
          <TransactionConfirm
            device={device}
            account={creatableAccount}
            message="Canton Onboarding"
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
  isProcessing,
  onboardingStatus,
  onOnboardAccount,
  transitionTo,
}: StepProps) => {
  const handleNext = () => {
    if (onboardingStatus === OnboardStatus.SUCCESS) {
      transitionTo(StepId.AUTHORIZE);
    }
    onOnboardAccount();
  };

  const isNextDisabled = onboardingStatus !== OnboardStatus.SUCCESS || isProcessing;

  if (onboardingStatus === OnboardStatus.SIGN) {
    return <></>;
  }

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <CurrencyBadge currency={currency} />
      <Button primary disabled={isNextDisabled} onClick={handleNext}>
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

const SectionAccountsStyled = styled(Box)`
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
