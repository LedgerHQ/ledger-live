import { Box, Flex, Text, Icons, InfiniteLoader, Alert } from "@ledgerhq/native-ui";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Option, OptionProps } from "./Option";
import styled from "styled-components";
import {
  AnalyticsButton,
  AnalyticsPage,
  useLedgerSyncAnalytics,
} from "../../hooks/useLedgerSyncAnalytics";
import { Separator } from "../../components/Separator";
import { TouchableOpacity } from "react-native";
import ManageKeyDrawer from "../ManageKey/ManageKeyDrawer";
import { useManageKeyDrawer } from "../ManageKey/useManageKeyDrawer";
import ManageInstanceDrawer from "../ManageInstances/ManageInstancesDrawer";
import { useManageInstancesDrawer } from "../ManageInstances/useManageInstanceDrawer";
import ActivationDrawer from "../Activation/ActivationDrawer";
import { Steps } from "../../types/Activation";
import { TrackScreen } from "~/analytics";
import { AlertLedgerSyncDown } from "../../components/AlertLedgerSyncDown";
import { useLedgerSyncStatus } from "../../hooks/useLedgerSyncStatus";
import { TrustchainNotFound } from "@ledgerhq/trustchain/errors";

const WalletSyncManage = () => {
  const { t } = useTranslation();

  const manageKeyHook = useManageKeyDrawer();
  const manageInstancesHook = useManageInstancesDrawer();

  const { error: ledgerSyncError, isError: isLedgerSyncError } = useLedgerSyncStatus();

  const { data, isLoading, isError, error: manageInstancesError } = manageInstancesHook.memberHook;

  const { onClickTrack } = useLedgerSyncAnalytics();

  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);

  const goToSync = () => {
    setIsSyncDrawerOpen(true);
    onClickTrack({ button: AnalyticsButton.Synchronize, page: AnalyticsPage.LedgerSyncSettings });
  };

  const closeSyncDrawer = () => setIsSyncDrawerOpen(false);

  const goToManageBackup = () => {
    manageKeyHook.openDrawer();
    onClickTrack({ button: AnalyticsButton.ManageKey, page: AnalyticsPage.LedgerSyncSettings });
  };

  const goToManageInstances = () => {
    manageInstancesHook.openDrawer();
    onClickTrack({
      button: AnalyticsButton.ManageInstances,
      page: AnalyticsPage.LedgerSyncSettings,
    });
  };

  const Options: OptionProps[] = [
    {
      label: t("walletSync.walletSyncActivated.synchronize.title"),
      description: t("walletSync.walletSyncActivated.synchronize.description"),
      onClick: goToSync,
      testId: "walletSync-synchronize",
      id: "synchronize",
    },
    {
      label: t("walletSync.walletSyncActivated.manageKey.title"),
      description: t("walletSync.walletSyncActivated.manageKey.description"),
      onClick: goToManageBackup,
      testId: "walletSync-manage-backup",
      id: "manageKey",
    },
  ];

  const error = useMemo(
    () => ledgerSyncError || manageInstancesError,
    [ledgerSyncError, manageInstancesError],
  );

  const getTopContent = () => {
    if (error) {
      if (isLedgerSyncError) {
        return <AlertLedgerSyncDown />;
      }
      return <Alert type="error" title={error.message} />;
    } else {
      return <Separator />;
    }
  };

  const hasError = isLedgerSyncError || isError;

  return (
    <Box height="100%" paddingX="16px">
      <TrackScreen category={AnalyticsPage.LedgerSyncSettings} />

      {getTopContent()}

      {Options.map((props, index) => (
        <Option
          {...props}
          key={index}
          disabled={
            props.id === "manageKey"
              ? hasError && error instanceof TrustchainNotFound
                ? false
                : hasError
              : hasError
          }
        />
      ))}

      <InstancesRow disabled={hasError} onPress={isError ? undefined : goToManageInstances}>
        <Container
          flexDirection="row"
          justifyContent="space-between"
          paddingTop={24}
          alignItems="center"
          disabled={hasError}
        >
          {isLoading ? (
            <InfiniteLoader size={16} />
          ) : (
            <Text fontWeight="semiBold" variant="large" color="neutral.c100">
              {isError
                ? t("walletSync.walletSyncActivated.synchronizedInstances.error")
                : t("walletSync.walletSyncActivated.synchronizedInstances.title", {
                    count: data?.length,
                  })}
            </Text>
          )}

          <Flex flexDirection="row" alignItems="center" justifyContent="center">
            <Text variant="body" color="primary.c80" mr={2}>
              {t("walletSync.walletSyncActivated.synchronizedInstances.cta")}
            </Text>
            <Icons.ChevronRight size="M" color="neutral.c70" />
          </Flex>
        </Container>
      </InstancesRow>

      <ActivationDrawer
        startingStep={Steps.ChooseSyncMethod}
        isOpen={isSyncDrawerOpen}
        handleClose={closeSyncDrawer}
      />
      <ManageKeyDrawer {...manageKeyHook} />
      <ManageInstanceDrawer {...manageInstancesHook} />
    </Box>
  );
};

export default WalletSyncManage;

const InstancesRow = styled(TouchableOpacity)<{ disabled?: boolean }>`
  &:hover {
    cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  }
`;

const Container = styled(Flex).attrs((p: { disabled?: boolean }) => ({
  opacity: p.disabled ? 0.3 : 1,
}))<{ disabled?: boolean }>``;
