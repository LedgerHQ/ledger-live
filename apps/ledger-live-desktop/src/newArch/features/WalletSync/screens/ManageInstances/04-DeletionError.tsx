import { Box, Flex, Icons, Link, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import styled, { useTheme } from "styled-components";
import { setFlow } from "~/renderer/actions/walletSync";
import ButtonV3 from "~/renderer/components/ButtonV3";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { AnalyticsPage, useLedgerSyncAnalytics } from "../../hooks/useLedgerSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100%;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export enum ErrorReason {
  UNSECURED = "unsecured",
  AUTO_REMOVE = "auto-remove",
}

type Props = {
  error: ErrorReason;
};

interface ErrorConfig {
  icon: React.ReactNode;
  title: string;
  description?: string;
  info?: string;
  cta: string;
  ctaSecondary: string;
  primaryAction: () => void;
  secondaryAction: () => void;
  analyticsPage: AnalyticsPage;
}

export const DeletionError = ({ error }: Props) => {
  const dispatch = useDispatch();

  const { onClickTrack } = useLedgerSyncAnalytics();

  const tryAgain = () => {
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.DeviceActionInstance }));
    onClickTrack({ button: "connect new ledger", page: errorConfig[error].analyticsPage });
  };
  const goToDelete = () => {
    dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.DeleteBackup }));
    onClickTrack({ button: "Delete sync", page: errorConfig[error].analyticsPage });
  };

  const understood = () => {
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances }));
    onClickTrack({ button: "I understand", page: errorConfig[error].analyticsPage });
  };
  const { t } = useTranslation();
  const { colors } = useTheme();

  const errorConfig: Record<ErrorReason, ErrorConfig> = {
    [ErrorReason.UNSECURED]: {
      icon: <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />,
      title: t("walletSync.unsecuredError.title"),
      description: t("walletSync.unsecuredError.description"),
      cta: t("walletSync.unsecuredError.cta"),
      ctaSecondary: t("walletSync.unsecuredError.ctaDelete"),
      primaryAction: tryAgain,
      secondaryAction: goToDelete,
      analyticsPage: AnalyticsPage.Unsecured,
    },
    [ErrorReason.AUTO_REMOVE]: {
      icon: <Icons.InformationFill size={"L"} color={colors.primary.c80} />,
      title: t("walletSync.autoRemoveError.title"),
      description: t("walletSync.autoRemoveError.description"),
      cta: t("walletSync.autoRemoveError.cta"),
      ctaSecondary: t("walletSync.autoRemoveError.ctaDelete"),
      primaryAction: understood,
      secondaryAction: goToDelete,
      analyticsPage: AnalyticsPage.AutoRemove,
    },
  };

  const getErrorConfig = (error: ErrorReason) => errorConfig[error];

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
  } = getErrorConfig(error);

  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      rowGap="24px"
      paddingX={50}
    >
      <TrackPage category={analyticsPage} />
      <Container>{icon}</Container>
      <Text fontSize={24} variant="h4Inter" color="neutral.c100" textAlign="center">
        {title}
      </Text>

      <Flex flexDirection="column" rowGap="16px">
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" fontSize={14}>
          {description}
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" fontSize={14}>
          {info}
        </Text>
      </Flex>

      <ButtonV3 variant="main" onClick={primaryAction}>
        {cta}
      </ButtonV3>

      <Link color="neutral.c70" onClick={secondaryAction}>
        <Text fontSize={14} variant="paragraph" fontWeight="semiBold" color="neutral.c70">
          {ctaSecondary}
        </Text>
      </Link>
    </Flex>
  );
};
