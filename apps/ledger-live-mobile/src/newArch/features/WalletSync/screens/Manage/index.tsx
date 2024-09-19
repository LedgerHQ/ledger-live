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
import { useCustomTimeOut } from "../../hooks/useCustomTimeOut";

const WalletSyncManage = () => {
  const { t } = useTranslation();

  const manageKeyHook = useManageKeyDrawer();
  const manageInstancesHook = useManageInstancesDrawer();
  const { error: ledgerSyncError, isError: isLedgerSyncError } = useLedgerSyncStatus();

  const {
    data,
    isLoading,
    isError,
    error: manageInstancesError,
    isFetching,
    isFetchedAfterMount,
    isPending,
  } = manageInstancesHook.memberHook;

  const { onClickTrack } = useLedgerSyncAnalytics();

  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);

  const goToSync = () => {
    manageInstancesHook.checkInstances();
    setIsSyncDrawerOpen(true);
    onClickTrack({ button: AnalyticsButton.Synchronize, page: AnalyticsPage.LedgerSyncSettings });
  };

  const closeSyncDrawer = () => setIsSyncDrawerOpen(false);

  const goToManageBackup = () => {
    manageKeyHook.openDrawer();
    onClickTrack({
      button: AnalyticsButton.ManageKey,
      page: AnalyticsPage.LedgerSyncSettings,
      hasFlow: false,
    });
  };

  const goToManageInstances = () => {
    manageInstancesHook.checkInstances();
    manageInstancesHook.openDrawer();
    onClickTrack({
      button: AnalyticsButton.ManageInstances,
      page: AnalyticsPage.LedgerSyncSettings,
      hasFlow: false,
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

  const queryFetching = isPending || isFetching;
  // the following checks if the instance has been deleted from another device to avoid a blink
  // in dev on a real device it will blink since it's laggy
  const unsynchronizedInstance = !data && !isFetchedAfterMount;

  const forcedTimeLoaderOver = useCustomTimeOut(500);
  const shouldDisplayLoader = !forcedTimeLoaderOver || unsynchronizedInstance || queryFetching;

  return (
    <Box height="100%" paddingX="16px">
      <TrackScreen category={AnalyticsPage.LedgerSyncSettings} />
      {shouldDisplayLoader ? (
        <Flex justifyContent="center" alignItems="center" height="100%">
          <InfiniteLoader size={64} />
        </Flex>
      ) : (
        <>
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
            startingStep={Steps.QrCodeMethod}
            isOpen={isSyncDrawerOpen}
            handleClose={closeSyncDrawer}
          />
          <ManageKeyDrawer {...manageKeyHook} />
          <ManageInstanceDrawer {...manageInstancesHook} />
        </>
      )}
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
