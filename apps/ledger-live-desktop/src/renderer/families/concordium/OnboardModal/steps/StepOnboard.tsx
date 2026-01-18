import React, { memo } from "react";
import { Trans } from "react-i18next";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { AccountOnboardStatus } from "@ledgerhq/types-live";
import styled from "styled-components";
import { urls } from "~/config/urls";
import AccountRow from "~/renderer/components/AccountsList/AccountRow";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import QRCode from "~/renderer/components/QRCode";
import Spinner from "~/renderer/components/Spinner";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { StepProps } from "../types";
import { Text } from "@ledgerhq/react-ui";

const SectionAccounts = memo(
  ({
    accountName,
    creatableAccount,
  }: Pick<
    StepProps,
    "currency" | "accountName" | "editedNames" | "creatableAccount" | "importableAccounts"
  >) => {
    return (
      <SectionAccountsStyled>
        <Box mb={4}>
          <Box
            horizontal
            ff="Inter|Bold"
            color="palette.text.shade100"
            fontSize={2}
            textTransform="uppercase"
            mb={3}
          >
            <Trans i18nKey="families.concordium.addAccount.identity.newAccount" />
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

const getErrorMessage = (error: unknown) => {
  if (error instanceof UserRefusedOnDevice || error instanceof LockedDeviceError) {
    return <Trans i18nKey={error.message} />;
  }

  return <Trans i18nKey="families.concordium.addAccount.identity.error" />;
};

export default function StepOnboard({
  currency,
  accountName,
  editedNames,
  creatableAccount,
  importableAccounts,
  onboardingStatus,
  error,
  isPairing,
  walletConnectUri,
  sessionTopic,
}: StepProps) {
  const link = useLocalizedUrl(urls.concordium.learnMore);

  if (onboardingStatus === AccountOnboardStatus.INIT && !isPairing) {
    return (
      <Alert type="help" learnMoreUrl={link} noIcon>
        <AcknowledgmentBox>
          <AcknowledgmentTitle>
            <Trans i18nKey="families.concordium.addAccount.acknowledge.title" />
          </AcknowledgmentTitle>

          <Box>
            <Trans i18nKey="families.concordium.addAccount.acknowledge.description" />
          </Box>

          <AcknowledgmentList>
            {[...Array(4).keys()].map(i => (
              <li key={i}>
                <Trans i18nKey={`families.concordium.addAccount.acknowledge.list.${i + 1}`}>
                  <Text fontWeight="700"></Text>
                </Trans>
              </li>
            ))}
          </AcknowledgmentList>
        </AcknowledgmentBox>
      </Alert>
    );
  }

  const renderContent = () => {
    switch (true) {
      case onboardingStatus === AccountOnboardStatus.PREPARE && !!walletConnectUri:
        return (
          <Box mt={2} alignItems="center">
            <QRCodeWrapper>
              <QRCode size={160} data={walletConnectUri} />
            </QRCodeWrapper>
            <Box mt={4}>
              <Alert type="hint">
                <Trans i18nKey="families.concordium.addAccount.identity.scanQRCode" />
              </Alert>
            </Box>
          </Box>
        );
      case onboardingStatus === AccountOnboardStatus.SUCCESS && !!sessionTopic:
        return (
          <Box>
            <Alert type="success">
              <Trans i18nKey="families.concordium.addAccount.identity.success" />
            </Alert>
          </Box>
        );
      case onboardingStatus === AccountOnboardStatus.ERROR:
        return (
          <Box>
            <Alert type="error">{getErrorMessage(error)}</Alert>
          </Box>
        );
      default:
        return (
          <LoadingRow>
            <Spinner color="palette.text.shade60" size={16} />
            <Box ml={2} ff="Inter|Regular" color="palette.text.shade60" fontSize={4}>
              <Trans i18nKey="families.concordium.addAccount.identity.connecting" />
            </Box>
          </LoadingRow>
        );
    }
  };

  return (
    <Box>
      <SectionAccounts
        currency={currency}
        accountName={accountName}
        editedNames={editedNames}
        creatableAccount={creatableAccount}
        importableAccounts={importableAccounts}
      />
      {renderContent()}
    </Box>
  );
}

export const StepOnboardFooter = ({
  isProcessing,
  onboardingStatus,
  onPair,
  isPairing,
  onCreateAccount,
  onCancel,
}: StepProps) => {
  const renderActionButton = () => {
    switch (true) {
      case onboardingStatus === AccountOnboardStatus.INIT && !isPairing:
        return (
          <Button primary onClick={onPair}>
            <Trans i18nKey="families.concordium.addAccount.acknowledge.allow" />
          </Button>
        );
      case onboardingStatus === AccountOnboardStatus.SUCCESS:
        return (
          <Button primary disabled={isProcessing} onClick={onCreateAccount}>
            <Trans i18nKey="common.continue" />
          </Button>
        );
      case onboardingStatus === AccountOnboardStatus.ERROR:
        return (
          <Button primary disabled={isProcessing} onClick={onPair}>
            <Trans i18nKey="common.tryAgain" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Box horizontal alignItems="center" justifyContent="space-between" grow>
      <Button onClick={onCancel}>
        <Trans i18nKey="common.cancel" />
      </Button>

      {renderActionButton()}
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
  border: 1px dashed ${p => p.theme.colors.neutral.c60};
`;

const QRCodeWrapper = styled(Box).attrs(() => ({
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 1,
  p: 2,
}))`
  background: ${p => p.theme.colors.white};
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

const AcknowledgmentBox = styled(Box).attrs(() => ({
  alignItems: "center",
  flexDirection: "column",
  px: 20,
  mb: 20,
}))`
  gap: 20px;
`;

const AcknowledgmentTitle = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
}))`
  text-align: center;
  font-weight: bold;
  font-size: 18px;
`;

const AcknowledgmentList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style-type: disc;
  padding-left: 30px;
  padding-right: 30px;
`;
