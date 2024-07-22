import { Box, Flex, Text, Icons, InfiniteLoader } from "@ledgerhq/native-ui";
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
import { useGetMembers } from "../../hooks/useGetMembers";

const WalletSyncManage = () => {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useGetMembers();

  const disabled = false;

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
    },
    {
      label: t("walletSync.walletSyncActivated.manageKey.title"),
      description: t("walletSync.walletSyncActivated.manageKey.description"),
      onClick: goToManageBackup,
      testId: "walletSync-manage-backup",
    },
  ];

  return (
    <Box height="100%" paddingX="16px">
      {/* <TrackPage category={AnalyticsPage.WalletSyncSettings} /> */}

      <Separator />

      {Options.map((props, index) => (
        <Option {...props} key={index} />
      ))}

      <InstancesRow disabled={disabled}>
        <Flex
          flexDirection="row"
          justifyContent="space-between"
          paddingTop={24}
          alignItems="center"
        >
          {isError ? (
            <Text fontSize={13.44} color="error.c60">
              {t("walletSync.walletSyncActivated.errors.fetching")}
            </Text>
          ) : isLoading ? (
            <InfiniteLoader size={16} />
          ) : (
            <Text fontWeight="semiBold" variant="large" color="neutral.c100">
              {t("walletSync.walletSyncActivated.synchronizedInstances.title", {
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
        </Flex>
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
