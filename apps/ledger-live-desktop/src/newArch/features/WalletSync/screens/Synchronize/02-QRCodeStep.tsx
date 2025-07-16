import React, { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Flex, Icons, Text, NumberedList, InfiniteLoader, TabSelector } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import QRCode from "~/renderer/components/QRCode";
import { useQRCode } from "../../hooks/useQRCode";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import TrackPage from "~/renderer/analytics/TrackPage";
import {
  AnalyticsFlow,
  AnalyticsPage,
  useLedgerSyncAnalytics,
} from "../../hooks/useLedgerSyncAnalytics";
import { AnimatePresence, motion, useAnimation } from "framer-motion";

const animation = {
  opacity: [0, 1],
  transition: { type: "spring", damping: 30, stiffness: 130 },
};

export enum Options {
  MOBILE = "mobile",
  DESKTOP = "desktop",
}

export default function SynchWithQRCodeStep({ sourcePage }: { sourcePage?: AnalyticsPage }) {
  const { t } = useTranslation();
  const controls = useAnimation();
  const [currentOption, setCurrentOption] = useState<Options>(Options.MOBILE);

  const { startQRCodeProcessing, url, error, isLoading } = useQRCode({ sourcePage });
  console.log("url", url);
  useEffect(() => {
    startQRCodeProcessing();

    controls.start({
      x: ["10vw", "0vw"],
      ...animation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { onClickTrack } = useLedgerSyncAnalytics();

  const handleSelectOption = (option: Options) => {
    controls.start({
      x: [currentOption === Options.MOBILE ? "-10vw" : "10vw", "0vw"],
      ...animation,
    });
    setCurrentOption(option);

    onClickTrack({
      button: option,
      page: AnalyticsPage.SyncWithQR,
      flow: AnalyticsFlow,
    });
  };

  const renderSwitch = () => {
    switch (currentOption) {
      case Options.MOBILE:
        return (
          <>
            <TrackPage category={AnalyticsPage.MobileSync} />
            <QRCodeComponent url={url} />
          </>
        );
      case Options.DESKTOP:
        return (
          <>
            <TrackPage category={AnalyticsPage.DesktopSync} />
            <DesktopComponent />
          </>
        );
    }
  };

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

      <TabSelector
        options={[Options.MOBILE, Options.DESKTOP]}
        selectedOption={currentOption}
        handleSelectOption={handleSelectOption}
        labels={{
          [Options.MOBILE]: t("walletSync.synchronize.qrCode.options.mobile"),
          [Options.DESKTOP]: t("walletSync.synchronize.qrCode.options.desktop"),
        }}
      />
      <Flex flexDirection="column" flex={1} alignItems="center" mt={12}>
        <AnimatePresence>
          <AnimatedDiv initial={{ x: "-10vw", opacity: 0 }} animate={controls}>
            {renderSwitch()}
          </AnimatedDiv>
        </AnimatePresence>
      </Flex>
    </Flex>
  );
}

const QRCodeComponent = ({ url }: { url: string | null }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const steps = [
    { element: t("walletSync.synchronize.qrCode.mobile.steps.step1") },
    { element: t("walletSync.synchronize.qrCode.mobile.steps.step2") },
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
            i18nKey="walletSync.synchronize.qrCode.mobile.steps.step3"
            t={t}
            components={[<Italic key={1} color={rgba(colors.neutral.c100, 0.7)} />]}
          />
        </Text>
      ),
    },
    { element: t("walletSync.synchronize.qrCode.mobile.steps.step4") },
  ];

  return (
    <>
      <QRContainer
        height={200}
        width={200}
        borderRadius={24}
        bg="constant.white"
        alignItems="center"
        justifyContent="center"
        mt={3}
      >
        {url && (
          <Flex
            borderRadius={24}
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
        mt={6}
        backgroundColor={colors.opacityDefault.c05}
      >
        <Text fontSize={16} variant="large" fontWeight="500" color="neutral.c100">
          {t("walletSync.synchronize.qrCode.mobile.description")}
        </Text>
        <NumberedList steps={steps} />
      </MiddleContainer>
    </>
  );
};

const DesktopComponent = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const steps = [
    { element: t("walletSync.synchronize.qrCode.desktop.steps.step1") },
    { element: t("walletSync.synchronize.qrCode.desktop.steps.step2") },
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
            i18nKey="walletSync.synchronize.qrCode.desktop.steps.step3"
            t={t}
            components={[<Italic key={1} color={rgba(colors.neutral.c100, 0.7)} />]}
          />
        </Text>
      ),
    },
    { element: t("walletSync.synchronize.qrCode.desktop.steps.step4") },
  ];

  return (
    <MiddleContainer
      rowGap="24px"
      flexDirection="column"
      p={"24px"}
      backgroundColor={colors.opacityDefault.c05}
    >
      <Text fontSize={16} variant="large" fontWeight="500" color="neutral.c100">
        {t("walletSync.synchronize.qrCode.desktop.description")}
      </Text>
      <NumberedList steps={steps} />
    </MiddleContainer>
  );
};

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

const AnimatedDiv = styled(motion.div)`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
`;
