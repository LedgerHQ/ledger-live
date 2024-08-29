import { Box, Flex, Icons, Link, Text } from "@ledgerhq/react-ui";
import React from "react";
import styled, { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { AnalyticsPage } from "../hooks/useLedgerSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useTranslation } from "react-i18next";

type Props = {
  title?: string;
  description?: string;
  cta?: string;
  onClick?: () => void;
  analyticsPage?: AnalyticsPage;
  ctaVariant?: "shade" | "main";
  onClose?: () => void;
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

export const Error = ({
  title,
  description,
  cta,
  onClick,
  analyticsPage,
  ctaVariant = "shade",
  onClose,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" rowGap="24px">
      <TrackPage category={String(analyticsPage)} />
      <Container>
        <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />
      </Container>
      <Text fontSize={24} variant="h4Inter" color="neutral.c100" textAlign="center">
        {title}
      </Text>
      <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
        {description}
      </Text>
      {cta && onClick && (
        <ButtonV3 variant={ctaVariant} onClick={onClick}>
          {cta}
        </ButtonV3>
      )}

      {onClose && (
        <Link color={"neutral.c100"} onClick={onClick}>
          <Text fontSize={14} variant="paragraph" fontWeight="semiBold" color="neutral.c70">
            {t("walletSync.close")}
          </Text>
        </Link>
      )}
    </Flex>
  );
};
