import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { Text } from "@ledgerhq/react-ui";
import { urls } from "~/config/urls";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import QRCode from "~/renderer/components/QRCode";
import Spinner from "~/renderer/components/Spinner";
import Link from "~/renderer/components/Link";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { StepProps } from "../types";
import { SectionAccounts } from "../components/SectionAccounts";
import { formatOnboardingError } from "../utils/errorFormatting";
import GetItOnGooglePlayImage from "~/renderer/modals/ProtectDiscover/images/get_it_on_google_play.png";
import GetItOnAppleStoreImage from "~/renderer/modals/ProtectDiscover/images/get_it_on_apple_store.png";

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
            <QRCodeWrapper
              role="img"
              aria-label="WalletConnect QR code for pairing with Concordium ID App"
            >
              <QRCode size={160} data={walletConnectUri} />
            </QRCodeWrapper>
            <Box mt={4}>
              <Alert type="hint">
                <Text variant="paragraph">
                  <Trans i18nKey="families.concordium.addAccount.identity.scanQRCode">
                    <Link type="color" onClick={() => openURL(link)} />
                  </Trans>
                </Text>
                <br />
                <br />
                <Text variant="paragraph">
                  <Trans i18nKey="families.concordium.addAccount.identity.ledgerSeedWarning">
                    <Text fontWeight="700"></Text>
                  </Trans>
                </Text>
              </Alert>
              <AppStoreSection mt={4} alignItems="center">
                <Text variant="small" color="neutral.c70" mb={3}>
                  <Trans i18nKey="families.concordium.addAccount.identity.downloadApp" />
                </Text>
                <AppStoreLinks horizontal justifyContent="center">
                  <AppStoreLink
                    href={urls.concordium.playStore}
                    onClick={e => {
                      e.preventDefault();
                      openURL(urls.concordium.playStore);
                    }}
                  >
                    <AppStoreImage src={GetItOnGooglePlayImage} alt="Get it on Google Play" />
                  </AppStoreLink>
                  <AppStoreLink
                    href={urls.concordium.appStore}
                    onClick={e => {
                      e.preventDefault();
                      openURL(urls.concordium.appStore);
                    }}
                  >
                    <AppStoreImage src={GetItOnAppleStoreImage} alt="Get it on Apple Store" />
                  </AppStoreLink>
                </AppStoreLinks>
              </AppStoreSection>
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
            <Alert type="error">{formatOnboardingError(error, "onboard")}</Alert>
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

const AppStoreSection = styled(Box)`
  width: 100%;
`;

const AppStoreLinks = styled(Box)`
  gap: 12px;
`;

const AppStoreLink = styled.a`
  cursor: pointer;
  display: flex;
`;

const AppStoreImage = styled.img`
  height: 40px;
  width: auto;
`;
