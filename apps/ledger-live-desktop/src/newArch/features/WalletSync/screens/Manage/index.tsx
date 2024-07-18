import { Box, Flex, Text, Icons, InfiniteLoader } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import useTheme from "~/renderer/hooks/useTheme";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { Option, OptionProps } from "./Option";
import styled from "styled-components";
import { useInstances } from "../ManageInstances/useInstances";
import { useLifeCycle } from "../../hooks/walletSync.hooks";
import TrackPage from "~/renderer/analytics/TrackPage";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";

const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};

const WalletSyncManage = () => {
  const { t } = useTranslation();
  useLifeCycle();
  const { instances, isLoading, hasError } = useInstances();

  const dispatch = useDispatch();

  const { onClickTrack } = useWalletSyncAnalytics();

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeMode }));

    onClickTrack({ button: "Synchronize", page: AnalyticsPage.WalletSyncSettings });
  };

  const goToManageBackup = () => {
    dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.ManageBackup }));
    onClickTrack({ button: "Manage Backup", page: AnalyticsPage.WalletSyncSettings });
  };

  const goToManageInstances = () => {
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances }));
    onClickTrack({ button: "Manage Instances", page: AnalyticsPage.WalletSyncSettings });
  };

  const Options: OptionProps[] = [
    {
      label: t("walletSync.manage.synchronize.label"),
      description: t("walletSync.manage.synchronize.description"),
      onClick: goToSync,
      testId: "walletSync-synchronize",
    },
    {
      label: t("walletSync.manage.backup.label"),
      description: t("walletSync.manage.backup.description"),
      onClick: goToManageBackup,
      testId: "walletSync-manage-backup",
    },
  ];

  return (
    <Box height="100%" paddingX="40px">
      <TrackPage category={AnalyticsPage.WalletSyncSettings} />
      <Box marginBottom={"24px"}>
        <Text fontSize={23} variant="large">
          {t("walletSync.title")}
        </Text>
      </Box>

      <Separator />

      {Options.map((props, index) => (
        <Option {...props} key={index} />
      ))}

      <InstancesRow
        paddingY={24}
        justifyContent="space-between"
        onClick={!isLoading && !hasError ? goToManageInstances : undefined}
        data-testid="walletSync-manage-instances"
        disabled={isLoading || hasError}
      >
        {hasError ? (
          <Text fontSize={13.44} color="error.c60">
            {t("walletSync.error.fetching")}
          </Text>
        ) : isLoading ? (
          <InfiniteLoader size={16} />
        ) : (
          <Text fontSize={13.44}>
            {t("walletSync.manage.instance.label", { count: instances?.length })}
          </Text>
        )}

        <Flex columnGap={"8px"} alignItems={"center"}>
          <Text fontSize={13.44}>{t("walletSync.manage.instance.cta")}</Text>
          <Icons.ChevronRight size="S" />
        </Flex>
      </InstancesRow>
    </Box>
  );
};

export default WalletSyncManage;

const InstancesRow = styled(Flex)<{ disabled?: boolean }>`
  &:hover {
    cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  }
`;
