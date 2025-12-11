import { Box, Flex, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { AnalyticsFlow, AnalyticsPage } from "../hooks/useLedgerSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import ButtonV3 from "~/renderer/components/ButtonV3";

export type GenericProps = {
  title?: string;
  description?: string;
  withClose?: boolean;
  withCta?: boolean;
  onClick?: () => void;
  onClose?: () => void;
  analyticsPage?: AnalyticsPage;
  type?: "success" | "info";
  specificCta?: string;
  /** When true, uses a full height layout with content centered and buttons at bottom */
  fullHeight?: boolean;
};

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const GenericStatusDisplay = ({
  title,
  description,
  withClose = false,
  withCta = false,
  onClick,
  onClose,
  analyticsPage,
  type,
  specificCta,
  fullHeight = false,
}: GenericProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const content = (
    <>
      <Container>
        {type === "info" ? (
          <Icons.InformationFill size={"L"} color={colors.primary.c60} />
        ) : (
          <Icons.CheckmarkCircleFill size={"L"} color={colors.success.c60} />
        )}
      </Container>
      <Text fontSize={24} variant="h4Inter" color="neutral.c100" textAlign="center">
        {title}
      </Text>
      <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
        {description}
      </Text>
    </>
  );

  const buttons = (withClose || withCta) && (
    <BottomContainer
      mb={fullHeight ? undefined : 3}
      width="100%"
      px={fullHeight ? undefined : "40px"}
      flexDirection="column"
      justifyContent={fullHeight ? undefined : "center"}
      rowGap="16px"
    >
      {withCta && onClick && (
        <ButtonV3 variant="main" onClick={onClick} flex={1}>
          {specificCta ?? t("walletSync.success.synchAnother")}
        </ButtonV3>
      )}
      {withClose && (
        <ButtonV3 variant="shade" onClick={onClose} flex={1}>
          {t("walletSync.success.close")}
        </ButtonV3>
      )}
    </BottomContainer>
  );

  if (fullHeight) {
    return (
      <Flex flexDirection="column" alignItems="center" height="80%">
        <TrackPage category={String(analyticsPage)} flow={AnalyticsFlow} />
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          rowGap="24px"
          flex={1}
        >
          {content}
        </Flex>
        {buttons}
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" rowGap="24px">
      <TrackPage category={String(analyticsPage)} flow={AnalyticsFlow} />
      {content}
      {buttons}
    </Flex>
  );
};

const BottomContainer = styled(Flex)``;
