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
                i18nKey="canton.addAccount.onboard.onboarded"
                count={importableAccounts?.length}
              />
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
            <Trans i18nKey="canton.addAccount.onboard.newAccount" />
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
    case OnboardStatus.PREPARE:
      return "canton.addAccount.onboard.status.prepare";
    case OnboardStatus.SUBMIT:
      return "canton.addAccount.onboard.status.submit";
    default:
      return "canton.addAccount.onboard.status.default";
  }
};

export default function StepOnboard({
  device,
  currency,
  accountName,
  editedNames,
  creatableAccount,
  importableAccounts,
  onboardingStatus,
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
              <Alert type="hint">
                <Trans i18nKey="canton.addAccount.onboard.init" />
              </Alert>
            </Box>
          </Box>
        );

      case OnboardStatus.SIGN:
        return <TransactionConfirm device={device} />;

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
              <Alert type="success">
                <Trans i18nKey="canton.addAccount.onboard.success" />
              </Alert>
            </Box>
          </Box>
        );

      case OnboardStatus.ERROR:
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
              <Alert type="error">
                <Trans i18nKey="canton.addAccount.onboard.error" />
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
                <Trans i18nKey={getStatusMessage(onboardingStatus)} />
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
  onRetry,
  transitionTo,
}: StepProps) => {
  if (onboardingStatus === OnboardStatus.SIGN) {
    return <></>;
  }

  const renderContent = (onboardingStatus: OnboardStatus) => {
    switch (onboardingStatus) {
      case OnboardStatus.SUCCESS:
        return (
          <Button primary disabled={isProcessing} onClick={() => transitionTo(StepId.AUTHORIZE)}>
            <Trans i18nKey="common.continue" />
          </Button>
        );
      case OnboardStatus.ERROR:
        return (
          <Button primary disabled={isProcessing} onClick={onRetry}>
            <Trans i18nKey="common.tryAgain" />
          </Button>
        );
      default:
        return (
          <Button primary disabled={isProcessing} onClick={onOnboardAccount}>
            <Trans i18nKey="common.continue" />
          </Button>
        );
    }
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <CurrencyBadge currency={currency} />
      {renderContent(onboardingStatus)}
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
