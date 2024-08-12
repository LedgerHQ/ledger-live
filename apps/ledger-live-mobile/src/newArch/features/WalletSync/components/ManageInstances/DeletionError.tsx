import React from "react";
import { Box, Icons, Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import {
  useWalletSyncAnalytics,
  AnalyticsButton,
  AnalyticsPage,
} from "../../hooks/useWalletSyncAnalytics";
import styled, { useTheme } from "styled-components/native";
import TrackScreen from "~/analytics/TrackScreen";

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};
  border-radius: 100px;
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
  tryAgain?: () => void;
  understood?: () => void;
  goToDelete?: () => void;
};

export const DeletionError = ({ error, tryAgain, goToDelete, understood }: Props) => {
  const { onClickTrack } = useWalletSyncAnalytics();

  const onTryAgain = () => {
    tryAgain?.();
    onClickTrack({ button: AnalyticsButton.UseAnother, page: errorConfig[error].analyticsPage });
  };
  const onGoToDelete = () => {
    goToDelete?.();
    onClickTrack({ button: AnalyticsButton.DeleteKey, page: errorConfig[error].analyticsPage });
  };

  const onUnderstood = () => {
    understood?.();
    onClickTrack({ button: AnalyticsButton.Understand, page: errorConfig[error].analyticsPage });
  };
  const { t } = useTranslation();
  const { colors } = useTheme();

  const errorConfig = {
    [ErrorReason.UNSECURED]: {
      icon: <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />,
      title: t("walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.title"),
      description: t(
        "walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.description",
      ),
      info: t("walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.info"),
      cta: t("walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.cta"),
      ctaSecondary: t(
        "walletSync.walletSyncActivated.synchronizedInstances.unsecuredError.ctaDelete",
      ),
      primaryAction: onTryAgain,
      secondaryAction: onGoToDelete,
      analyticsPage: AnalyticsPage.RemoveInstanceWrongDevice,
    },
    [ErrorReason.AUTO_REMOVE]: {
      icon: <Icons.InformationFill size={"L"} color={colors.primary.c80} />,
      title: t("walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.title"),
      description: t(
        "walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.description",
      ),
      info: t("walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.info"),
      cta: t("walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.cta"),
      ctaSecondary: t(
        "walletSync.walletSyncActivated.synchronizedInstances.autoRemoveError.ctaDelete",
      ),
      primaryAction: onUnderstood,
      secondaryAction: onGoToDelete,
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
    <Flex flexDirection="column" alignItems="center" justifyContent="center">
      <TrackScreen category={analyticsPage} />
      <Container mb={6}>{icon}</Container>
      <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold" mb={4}>
        {title}
      </Text>

      <Flex flexDirection="column" mb={8} rowGap={16}>
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
          {description}
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
          {info}
        </Text>
      </Flex>

      <Flex flexDirection="column" rowGap={24} mb={6} width={"100%"} px={"16px"}>
        <Button type="main" onPress={primaryAction}>
          {cta}
        </Button>

        <Link onPress={secondaryAction}>
          <Text variant="paragraph" fontWeight="semiBold" color="neutral.c70">
            {ctaSecondary}
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
};
