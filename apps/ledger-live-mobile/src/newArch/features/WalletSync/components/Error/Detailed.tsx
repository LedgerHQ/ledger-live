import React from "react";
import { Flex, Text, Button, Link, Box } from "@ledgerhq/native-ui";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import TrackScreen from "~/analytics/TrackScreen";
import { ButtonProps } from "@ledgerhq/native-ui/components/cta/Button";
import styled from "styled-components/native";

interface Props {
  icon: React.ReactNode;
  title: string;
  description?: string;
  info?: string;
  cta: string;
  ctaSecondary?: string;
  primaryAction: () => void;
  secondaryAction?: () => void;
  analyticsPage: AnalyticsPage;
  buttonType: ButtonProps["type"];
  outline?: boolean;
}
export function DetailedError(props: Props) {
  const {
    icon,
    title,
    description,
    info,
    cta,
    ctaSecondary,
    primaryAction,
    secondaryAction,
    analyticsPage,
    buttonType,
    outline,
  } = props;

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center">
      <TrackScreen category={analyticsPage} />
      <Container mb={6}>{icon}</Container>
      <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold" mb={4}>
        {title}
      </Text>

      <Flex flexDirection="column" mb={8} rowGap={16}>
        {description && (
          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
            {description}
          </Text>
        )}
        {info && (
          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
            {info}
          </Text>
        )}
      </Flex>

      <Flex flexDirection="column" rowGap={24} mb={6} width={"100%"} px={"16px"}>
        <Button type={buttonType} outline={outline} onPress={primaryAction}>
          {cta}
        </Button>
        {ctaSecondary && secondaryAction && (
          <Link onPress={secondaryAction}>
            <Text variant="paragraph" fontWeight="semiBold" color="neutral.c70">
              {ctaSecondary}
            </Text>
          </Link>
        )}
      </Flex>
    </Flex>
  );
}

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100px;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
