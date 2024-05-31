import { Box, Flex, Text, Icons } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import useTheme from "~/renderer/hooks/useTheme";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow } from "~/renderer/reducers/walletSync";
import { OptionContainer, Option, OptionProps } from "./Option";

const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};

const WalletSyncManage = () => {
  const { t } = useTranslation();
  const nbInstances = 1;

  const dispatch = useDispatch();

  const goToSynch = () => {
    dispatch(setFlow(Flow.Synchronize));
  };

  const goToManageBackups = () => {
    dispatch(setFlow(Flow.ManageBackups));
  };

  const Options: OptionProps[] = [
    {
      label: t("walletSync.manage.synchronize.label"),
      description: t("walletSync.manage.synchronize.description"),
      onClick: goToSynch,
    },
    {
      label: t("walletSync.manage.backup.label"),
      description: t("walletSync.manage.backup.description"),
      onClick: goToManageBackups,
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

      <Flex paddingY={24} justifyContent="space-between">
        <Text fontSize={13.44}>
          {t("walletSync.manage.instance.label", { count: nbInstances })}
        </Text>

        <OptionContainer>
          <Flex columnGap={"8px"} alignItems={"center"}>
            <Text fontSize={13.44}>{t("walletSync.manage.instance.cta")}</Text>
            <Icons.ChevronRight size="S" />
          </Flex>
        </OptionContainer>
      </Flex>
    </Box>
  );
};

export default WalletSyncManage;
