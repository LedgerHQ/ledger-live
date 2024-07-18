import React, { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Flex, Icons, Link, Text, NumberedList, InfiniteLoader } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import QRCode from "~/renderer/components/QRCode";
import { useQRCode } from "../../hooks/useQRCode";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import TrackPage from "~/renderer/analytics/TrackPage";
import { AnalyticsPage } from "../../hooks/useWalletSyncAnalytics";

export default function SynchWithQRCodeStep() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const steps = [
    { element: t("walletSync.synchronize.qrCode.steps.step1") },
    {
      element: (
        <Text
          flex={1}
          ml="12px"
          fontSize={14}
          variant="body"
          fontWeight="500"
          color={rgba(colors.neutral.c100, 0.7)}
        >
          <Trans
            i18nKey="walletSync.synchronize.qrCode.steps.step2"
            t={t}
            components={[<Italic key={1} color={rgba(colors.neutral.c100, 0.7)} />]}
          />
        </Text>
      ),
    },
    { element: t("walletSync.synchronize.qrCode.steps.step3") },
  ];

  const { goToActivation, startQRCodeProcessing, url, error, isLoading } = useQRCode();
  console.log("url", url);
  useEffect(() => {
    startQRCodeProcessing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    <Flex flexDirection="column" rowGap="24px" alignItems="center" flex={1}>
      <InfiniteLoader size={30} />
    </Flex>;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={startQRCodeProcessing} />;
  }

  return (
    <Flex flexDirection="column" rowGap="24px" alignItems="center" flex={1}>
      <TrackPage category={AnalyticsPage.SyncWithQR} />
      <Text
        fontSize={23}
        variant="large"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
      >
        {t("walletSync.synchronize.qrCode.title")}
      </Text>
      <Flex
        flexDirection="column"
        flex={1}
        rowGap="40px"
        alignItems="center"
        justifyContent="center"
      >
        <QRContainer
          height={200}
          width={200}
          borderRadius={24}
          position="relative"
          bg="constant.white"
          alignItems="center"
          justifyContent="center"
        >
          {url && (
            <Flex
              borderRadius={24}
              position="relative"
              bg="constant.white"
              alignItems="center"
              justifyContent="center"
              p={4}
            >
              <QRCode data={url} />
              <IconContainer
                p={"8px"}
                alignItems="center"
                justifyContent="center"
                bg="constant.white"
                position="absolute"
              >
                <Icons.LedgerLogo size="L" color="constant.black" />
              </IconContainer>
            </Flex>
          )}
        </QRContainer>

        <MiddleContainer
          rowGap="24px"
          flexDirection="column"
          p={"24px"}
          mt={3}
          backgroundColor={colors.opacityDefault.c05}
        >
          <Text fontSize={16} variant="large" fontWeight="500" color="neutral.c100">
            {t("walletSync.synchronize.qrCode.description")}
          </Text>
          <NumberedList steps={steps} />
        </MiddleContainer>
        <Link color="neutral.c70" onClick={goToActivation}>
          <Text fontSize={14} variant="paragraph" fontWeight="semiBold" color="neutral.c70">
            {t("walletSync.synchronize.qrCode.hint")}
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
}

const MiddleContainer = styled(Flex)`
  border-radius: 12px;
`;

const QRContainer = styled(Flex)`
  border: 1px solid ${({ theme }) => theme.colors.opacityDefault.c10};
`;

const Italic = styled(Text)`
  font-style: italic;
`;

const IconContainer = styled(Flex)``;
