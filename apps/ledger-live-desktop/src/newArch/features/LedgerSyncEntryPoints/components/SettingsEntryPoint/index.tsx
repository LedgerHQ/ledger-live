import { Button, Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import LogoDark from "../../assets/logo_dark.svg";
import LogoLight from "../../assets/logo_light.svg";
import Illustration from "~/renderer/components/Illustration";
import Box from "~/renderer/components/Box";
import { SettingsSectionRowContainer } from "~/renderer/screens/settings/SettingsSection";

export default function SettingsEntryPoint({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <SettingsSectionRowContainer tabIndex={-1}>
      <Flex alignItems="center" justifyContent="center">
        <Flex position="relative">
          <Illustration lightSource={LogoLight} darkSource={LogoDark} size={24} />
          <Flex
            bg="error.c60"
            width={4}
            height={4}
            position="absolute"
            right={0}
            bottom={0}
            borderRadius="50%"
          />
        </Flex>
        <Flex flexDirection="column" ml={4}>
          <Box ff="Inter|SemiBold" color="palette.text.shade100" fontSize={14}>
            {t("walletSync.entryPoints.settings.title")}
          </Box>
          <Box
            ff="Inter"
            fontSize={3}
            color="palette.text.shade60"
            mt={1}
            mr={1}
            style={{
              maxWidth: 520,
            }}
          >
            {t("walletSync.entryPoints.settings.description")}
          </Box>
        </Flex>
      </Flex>
      <Button variant="main" onClick={onPress}>
        <Text color="neutral.c00">{t("walletSync.entryPoints.settings.cta")}</Text>
      </Button>
    </SettingsSectionRowContainer>
  );
}
