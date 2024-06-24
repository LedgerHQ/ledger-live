import { Box, Flex, Text, Icons } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import useTheme from "~/renderer/hooks/useTheme";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { Option, OptionProps } from "./Option";
import styled from "styled-components";
import { useInstances } from "../ManageInstances/useInstances";

const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};

const WalletSyncManage = () => {
  const { t } = useTranslation();
  const { instances } = useInstances();

  const dispatch = useDispatch();

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeMode }));
  };

  const goToManageBackups = () => {
    dispatch(setFlow({ flow: Flow.ManageBackups, step: Step.ManageBackup }));
  };

  const goToManageInstances = () => {
    dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances }));
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
      onClick: goToManageBackups,
      testId: "walletSync-manage-backup",
    },
  ];

  return (
    <Box height="100%" paddingX="40px">
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
        onClick={goToManageInstances}
        data-testid="walletSync-manage-instances"
      >
        <Text fontSize={13.44}>
          {t("walletSync.manage.instance.label", { count: instances.length })}
        </Text>

        <Flex columnGap={"8px"} alignItems={"center"}>
          <Text fontSize={13.44}>{t("walletSync.manage.instance.cta")}</Text>
          <Icons.ChevronRight size="S" />
        </Flex>
      </InstancesRow>
    </Box>
  );
};

export default WalletSyncManage;

const InstancesRow = styled(Flex)`
  &:hover {
    cursor: pointer;
  }
`;
