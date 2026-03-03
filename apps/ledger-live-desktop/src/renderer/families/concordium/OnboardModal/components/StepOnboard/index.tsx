import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { urls } from "~/config/urls";
import Text from "~/renderer/components/Text";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import QRCode from "~/renderer/components/QRCode";
import Spinner from "~/renderer/components/Spinner";
import Link from "~/renderer/components/Link";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { StepProps } from "../../types";
import { SectionAccounts } from "../SectionAccounts";
import OnboardError from "../OnboardError";
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
  const learnMoreUrl = useLocalizedUrl(urls.concordium.learnMore);
  const appStoreUrl = useLocalizedUrl(urls.concordium.appStore);
  const playStoreUrl = useLocalizedUrl(urls.concordium.playStore);

  if (onboardingStatus === AccountOnboardStatus.INIT && !isPairing) {
    return (
      <Alert type="help" learnMoreUrl={learnMoreUrl} noIcon>
        <AcknowledgmentBox>
          <AcknowledgmentTitle>
            <Trans i18nKey="families.concordium.addAccount.acknowledge.title" />
          </AcknowledgmentTitle>

          <Box>
            <Trans i18nKey="families.concordium.addAccount.acknowledge.description" />
          </Box>

          <AcknowledgmentList>
            {[...new Array(4).keys()].map(i => (
              <li key={i}>
                <Trans i18nKey={`families.concordium.addAccount.acknowledge.list.${i + 1}`}>
                  <Text fontWeight="700" />
                </Trans>
              </li>
            ))}
          </AcknowledgmentList>
        </AcknowledgmentBox>
      </Alert>
    );
  }

  const renderContent = () => {
    switch (onboardingStatus) {
      case AccountOnboardStatus.PREPARE:
        if (walletConnectUri) {
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
                  <Text>
                    <Trans i18nKey="families.concordium.addAccount.identity.scanQRCode">
                      <Link type="color" onClick={() => openURL(learnMoreUrl)} />
                    </Trans>
                  </Text>
                  <br />
                  <br />
                  <Text>
                    <Trans i18nKey="families.concordium.addAccount.identity.ledgerSeedWarning">
                      <Text fontWeight="700" />
                    </Trans>
                  </Text>
                </Alert>
                <AppStoreSection mt={4} alignItems="center">
                  <Text color="neutral.c70" mb={3}>
                    <Trans i18nKey="families.concordium.addAccount.identity.downloadApp" />
                  </Text>
                  <AppStoreLinks horizontal justifyContent="center">
                    <AppStoreLink
                      href={playStoreUrl}
                      onClick={e => {
                        e.preventDefault();
                        openURL(playStoreUrl);
                      }}
                    >
                      <AppStoreImage src={GetItOnGooglePlayImage} alt="Get it on Google Play" />
                    </AppStoreLink>
                    <AppStoreLink
                      href={appStoreUrl}
                      onClick={e => {
                        e.preventDefault();
                        openURL(appStoreUrl);
                      }}
                    >
                      <AppStoreImage src={GetItOnAppleStoreImage} alt="Get it on Apple Store" />
                    </AppStoreLink>
                  </AppStoreLinks>
                </AppStoreSection>
              </Box>
            </Box>
          );
        }
        break;
      case AccountOnboardStatus.SUCCESS:
        if (sessionTopic) {
          return (
            <Box>
              <Alert type="success">
                <Trans i18nKey="families.concordium.addAccount.identity.success" />
              </Alert>
            </Box>
          );
        }
        break;
      case AccountOnboardStatus.ERROR:
        return (
          <Box>
            <OnboardError error={error} context="onboard" />
          </Box>
        );
    }
    return (
      <LoadingRow>
        <Spinner color="neutral.c60" size={16} />
        <Text ml={2} ff="Inter|Regular" color="neutral.c60" fontSize={4}>
          <Trans i18nKey="families.concordium.addAccount.identity.connecting" />
        </Text>
      </LoadingRow>
    );
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
  p: 1,
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
