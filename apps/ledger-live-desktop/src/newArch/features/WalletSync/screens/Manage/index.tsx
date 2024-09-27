import { Box, Flex, Text, Icons, InfiniteLoader } from "@ledgerhq/react-ui";
import React, { useMemo } from "react";
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
import { AnalyticsPage, useLedgerSyncAnalytics } from "../../hooks/useLedgerSyncAnalytics";
import { useLedgerSyncInfo } from "../../hooks/useLedgerSyncInfo";
import { AlertError } from "../../components/AlertError";
import { AlertLedgerSyncDown } from "../../components/AlertLedgerSyncDown";

const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};

const WalletSyncManage = () => {
  const { t } = useTranslation();
  useLifeCycle();

  const {
    statusQuery: { error: ledgerSyncError, isError: isLedgerSyncError },
  } = useLedgerSyncInfo();
  const { instances, isLoading, hasError, error: membersError } = useInstances();

  const dispatch = useDispatch();

  const { onClickTrack } = useLedgerSyncAnalytics();

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }));

    onClickTrack({
      button: "Synchronize with another app",
      page: AnalyticsPage.LedgerSyncSettings,
    });
  };

  const goToManageBackup = () => {
    dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.DeleteBackup }));
    onClickTrack({ button: "Delete sync", page: AnalyticsPage.LedgerSyncSettings });
  };

  const goToManageInstances = () => {
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances }));
    onClickTrack({ button: "Manage Instances", page: AnalyticsPage.LedgerSyncSettings });
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
  const error = useMemo(() => ledgerSyncError || membersError, [ledgerSyncError, membersError]);

  const disabled = useMemo(() => isLoading || !!error, [isLoading, error]);

  const getTopContent = () => {
    if (error) {
      if (isLedgerSyncError) {
        return <AlertLedgerSyncDown />;
      }
      return <AlertError error={error} />;
    } else {
      return <Separator />;
    }
  };

  return (
    <Box height="100%" paddingX="40px">
      <TrackPage category={AnalyticsPage.LedgerSyncSettings} />
      <Box marginBottom={"24px"}>
        <Text fontSize={23} variant="large">
          {t("walletSync.title")}
        </Text>
      </Box>

      {getTopContent()}

      {Options.map((props, index) => (
        <Option {...props} key={index} disabled={disabled} />
      ))}

      <InstancesRow
        paddingY={24}
        justifyContent="space-between"
        onClick={!isLoading && !hasError ? goToManageInstances : undefined}
        data-testid="walletSync-manage-instances"
        disabled={isLoading || hasError}
      >
        {isLoading ? (
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
  opacity: ${p => (p.disabled ? 0.3 : 1)};
`;
