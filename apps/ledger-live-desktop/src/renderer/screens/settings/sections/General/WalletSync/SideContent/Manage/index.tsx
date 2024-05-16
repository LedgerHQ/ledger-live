import { Box, Flex, Text, Icons } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import useTheme from "~/renderer/hooks/useTheme";
import { Option, OptionContainer, OptionProps } from "./Option";

const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};

<<<<<<<< HEAD:apps/ledger-live-desktop/src/newArch/WalletSync/SideContent/Manage/index.tsx
========
type SettingsOptionsProps = {
  label: string;
  description: string;
};

const SettingOption = styled.div`
  &:hover {
    cursor: pointer;
  }
`;
const SettingsOptions = ({ label, description }: SettingsOptionsProps) => (
  <SettingOption>
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
  </SettingOption>
);

>>>>>>>> 31ad06a2fe (Store components in several folder):apps/ledger-live-desktop/src/renderer/screens/settings/sections/General/WalletSync/SideContent/Manage/index.tsx
const WalletSyncManage = () => {
  const { t } = useTranslation();

  const Options: OptionProps[] = [
    {
      label: t("walletSync.manage.synchronize.label"),
      description: t("walletSync.manage.synchronize.description"),
    },
    {
      label: t("walletSync.manage.backup.label"),
      description: t("walletSync.manage.backup.description"),
    },
  ];

  return (
    <Box height="100%" paddingX="40px">
      <Box marginBottom={"24px"}>
        <Text fontSize={23} variant="large">
<<<<<<<< HEAD:apps/ledger-live-desktop/src/newArch/WalletSync/SideContent/Manage/index.tsx
          {t("walletSync.title")}
========
          Wallet Sync
>>>>>>>> 31ad06a2fe (Store components in several folder):apps/ledger-live-desktop/src/renderer/screens/settings/sections/General/WalletSync/SideContent/Manage/index.tsx
        </Text>
      </Box>

      <Separator />

      {Options.map((props, index) => (
        <Option {...props} key={index} />
      ))}

      <Flex paddingY={24} justifyContent="space-between">
        <Text fontSize={13.44}>{t("walletSync.manage.instance.label", { nbInstances: 0 })}</Text>

<<<<<<<< HEAD:apps/ledger-live-desktop/src/newArch/WalletSync/SideContent/Manage/index.tsx
        <OptionContainer>
========
        <SettingOption>
>>>>>>>> 31ad06a2fe (Store components in several folder):apps/ledger-live-desktop/src/renderer/screens/settings/sections/General/WalletSync/SideContent/Manage/index.tsx
          <Flex columnGap={"8px"} alignItems={"center"}>
            <Text fontSize={13.44}>{t("walletSync.manage.instance.cta")}</Text>
            <Icons.ChevronRight size="S" />
          </Flex>
<<<<<<<< HEAD:apps/ledger-live-desktop/src/newArch/WalletSync/SideContent/Manage/index.tsx
        </OptionContainer>
========
        </SettingOption>
>>>>>>>> 31ad06a2fe (Store components in several folder):apps/ledger-live-desktop/src/renderer/screens/settings/sections/General/WalletSync/SideContent/Manage/index.tsx
      </Flex>
    </Box>
  );
};

export default WalletSyncManage;
