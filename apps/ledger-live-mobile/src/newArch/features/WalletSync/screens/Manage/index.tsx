import { Box, Flex, Text, Icons, InfiniteLoader, Alert } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { Option, OptionProps } from "./Option";
import styled from "styled-components";
import {
  AnalyticsButton,
  AnalyticsPage,
  useWalletSyncAnalytics,
} from "../../hooks/useWalletSyncAnalytics";
import { Separator } from "../../components/Separator";
import { TouchableOpacity } from "react-native";
import { TrustchainNotFound, useGetMembers } from "../../hooks/useGetMembers";

const WalletSyncManage = () => {
  const { t } = useTranslation();

  const { data, isLoading, isError, error } = useGetMembers();

  const { onClickTrack } = useWalletSyncAnalytics();

  const goToSync = () => {
    //dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeMode }));

    onClickTrack({ button: AnalyticsButton.Synchronize, page: AnalyticsPage.WalletSyncActivated });
  };

  const goToManageBackup = () => {
    //dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.ManageBackup }));
    onClickTrack({ button: AnalyticsButton.ManageKey, page: AnalyticsPage.WalletSyncActivated });
  };

  // const goToManageInstances = () => {
  //   dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances }));
  //   onClickTrack({ button: "Manage Instances", page: AnalyticsPage.WalletSyncSettings });
  // };

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

  function getError(error: Error) {
    // if (error instanceof UnavailableServerError) { DO SOMETHING}

    return <Alert type="error" title={error.message} />;
  }

  return (
    <Box height="100%" paddingX="16px">
      {/* <TrackPage category={AnalyticsPage.WalletSyncSettings} /> */}

      {isError ? getError(error) : <Separator />}

      {Options.map((props, index) => (
        <Option
          {...props}
          key={index}
          disabled={
            props.id === "manageKey"
              ? error instanceof TrustchainNotFound
                ? false
                : isError
              : isError
          }
        />
      ))}

      <InstancesRow disabled={isError}>
        <Container
          flexDirection="row"
          justifyContent="space-between"
          paddingTop={24}
          alignItems="center"
          disabled={isError}
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
