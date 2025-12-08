import React, { memo } from "react";
import { Trans } from "react-i18next";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import styled from "styled-components";
import { AccountOnboardStatus } from "@ledgerhq/types-live";
import { UserRefusedOnDevice, LockedDeviceError } from "@ledgerhq/errors";
import { getDefaultAccountNameForCurrencyIndex } from "@ledgerhq/live-wallet/accountName";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import CurrencyBadge from "~/renderer/components/CurrencyBadge";
import Spinner from "~/renderer/components/Spinner";
import { TransactionConfirm } from "../components/TransactionConfirm";
import { StepId, StepProps } from "../types";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { isAxiosError } from "axios";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const SectionAccounts = memo(
  ({
    currency,
    accountName,
    editedNames,
    creatableAccount,
    importableAccounts,
    isReonboarding,
  }: Pick<
    StepProps,
    | "currency"
    | "accountName"
    | "editedNames"
    | "creatableAccount"
    | "importableAccounts"
    | "isReonboarding"
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
                i18nKey="families.canton.addAccount.onboard.onboarded"
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
            <Trans
              i18nKey={
                isReonboarding
                  ? "families.canton.addAccount.onboard.account"
                  : "families.canton.addAccount.onboard.newAccount"
              }
            />
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

const getStatusMessage = (status?: AccountOnboardStatus): string => {
  switch (status) {
    case AccountOnboardStatus.PREPARE:
      return "families.canton.addAccount.onboard.status.prepare";
    case AccountOnboardStatus.SUBMIT:
      return "families.canton.addAccount.onboard.status.submit";
    default:
      return "families.canton.addAccount.onboard.status.default";
  }
};

const getErrorMessage = (error: Error | null) => {
  if (error instanceof UserRefusedOnDevice || error instanceof LockedDeviceError) {
    return <Trans i18nKey={error.message} />;
  }
  return <Trans i18nKey="families.canton.addAccount.onboard.error" />;
};

export default function StepOnboard({
  device,
  currency,
  accountName,
  editedNames,
  creatableAccount,
  importableAccounts,
  onboardingStatus,
  error,
  isReonboarding,
}: StepProps) {
  const link = useLocalizedUrl(urls.canton.learnMore);
  const onClick = () => openURL(link);
  const renderContent = (onboardingStatus?: AccountOnboardStatus) => {
    switch (onboardingStatus) {
      case AccountOnboardStatus.INIT:
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
              isReonboarding={isReonboarding}
            />

            <Box>
              <Alert type={isReonboarding ? "warning" : "hint"}>
                <Trans
                  i18nKey={
                    isReonboarding
                      ? "families.canton.addAccount.reonboard.init"
                      : "families.canton.addAccount.onboard.init"
                  }
                />
              </Alert>
            </Box>
          </Box>
        );

      case AccountOnboardStatus.SIGN:
        return <TransactionConfirm device={device} />;

      case AccountOnboardStatus.SUCCESS:
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
              isReonboarding={isReonboarding}
            />

            <Box>
              <Alert type="success">
                <Trans
                  i18nKey={
                    isReonboarding
                      ? "families.canton.addAccount.reonboard.success"
                      : "families.canton.addAccount.onboard.success"
                  }
                />
              </Alert>
            </Box>
          </Box>
        );

      case AccountOnboardStatus.ERROR:
        if (isAxiosError(error) && error.status === 429) {
          return (
            <Box>
              <Alert type="error">
                <Trans i18nKey="families.canton.addAccount.onboard.error429" />
                <LinkWithExternalIcon
                  style={{
                    display: "inline-flex",
                  }}
                  onClick={onClick}
                  label={<Trans i18nKey="common.learnMore" />}
                />
              </Alert>
            </Box>
          );
        }
        return (
          <Box>
            <SectionAccounts
              currency={currency}
              accountName={accountName}
              editedNames={editedNames}
              creatableAccount={creatableAccount}
              importableAccounts={importableAccounts}
              isReonboarding={isReonboarding}
            />

            <Box>
              <Alert type="error">{getErrorMessage(error)}</Alert>
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
              isReonboarding={isReonboarding}
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
  onRetryOnboardAccount,
  transitionTo,
}: StepProps) => {
  const skipCantonPreapprovalStep = useFeature("cantonSkipPreapprovalStep");

  if (onboardingStatus === AccountOnboardStatus.SIGN) {
    return <></>;
  }

  const renderContent = (onboardingStatus: AccountOnboardStatus) => {
    switch (onboardingStatus) {
      case AccountOnboardStatus.SUCCESS:
        return (
          <Button
            primary
            disabled={isProcessing}
            onClick={() =>
              transitionTo(skipCantonPreapprovalStep?.enabled ? StepId.FINISH : StepId.AUTHORIZE)
            }
          >
            <Trans i18nKey="common.continue" />
          </Button>
        );
      case AccountOnboardStatus.ERROR:
        return (
          <Button primary disabled={isProcessing} onClick={onRetryOnboardAccount}>
            <Trans i18nKey="common.tryAgain" />
          </Button>
        );
      default:
        return (
          <Button primary disabled={isProcessing} onClick={onOnboardAccount}>
            {isProcessing && (
              <Box mr={2}>
                <Spinner size={20} />
              </Box>
            )}
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
