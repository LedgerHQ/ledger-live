import { Box, Flex, Text, Icons } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import useTheme from "~/renderer/hooks/useTheme";

const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};

type SettingsOptionsProps = {
  label: string;
  description: string;
  url: string;
};
const SettingsOptions = ({ label, description }: SettingsOptionsProps) => (
  <>
    <Flex>
      <Box paddingY={24} width={304}>
        <Box>
          <Text fontSize={13.44} variant="body">
            {label}
          </Text>
        </Box>
        <Text fontSize={13.44} variant="body" color="hsla(0, 0%, 58%, 1)">
          {description}
        </Text>
      </Box>

      <Flex flexGrow={1} alignItems={"center"} justifyContent={"end"}>
        <Icons.ChevronRight size="S" />
      </Flex>
    </Flex>

    <Separator />
  </>
);

const WalletSyncManage = () => {
  const { t } = useTranslation();

  const Options: SettingsOptionsProps[] = [
    {
      label: t("walletSync.manage.synchronize.label"),
      description: t("walletSync.manage.synchronize.description"),
      url: "",
    },
    {
      label: t("walletSync.manage.backup.label"),
      description: t("walletSync.manage.backup.description"),
      url: "",
    },
  ];

  return (
    <Box height="100%" paddingX="40px">
      <Box marginBottom={"24px"}>
        <Text variant="large">Wallet Sync</Text>
      </Box>

      <Separator />

      {Options.map(props => (
        <SettingsOptions {...props} />
      ))}

      <Flex paddingY={24} justifyContent="space-between">
        <Text fontSize={13.44}>{t("walletSync.manage.instance.label", { nbInstances: 0 })}</Text>
        <Flex columnGap={"8px"} alignItems={"center"}>
          <Text fontSize={13.44}>{t("walletSync.manage.instance.cta")}</Text>
          <Icons.ChevronRight size="S" />
        </Flex>
      </Flex>
    </Box>
  );
};

export default WalletSyncManage;
