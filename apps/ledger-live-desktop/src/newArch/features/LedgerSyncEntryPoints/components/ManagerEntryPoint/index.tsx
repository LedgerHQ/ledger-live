import { Button, Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import LogoDark from "../../assets/logo_dark.svg";
import LogoLight from "../../assets/logo_light.svg";
import Illustration from "~/renderer/components/Illustration";

export default function ManagerEntryPoint({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Flex
      bg="opacityDefault.c05"
      p="12px"
      borderRadius="8px"
      alignItems="center"
      justifyContent="space-between"
      columnGap="24px"
    >
      <Flex alignItems="center" justifyContent="center" flexShrink={1}>
        <Flex position="relative">
          <Illustration lightSource={LogoLight} darkSource={LogoDark} size={52} />
          <Flex
            bg="error.c60"
            width={8}
            height={8}
            position="absolute"
            right={0}
            bottom={0}
            borderRadius="50%"
          />
        </Flex>
        <Flex flexDirection="column" ml={4} flexShrink={1}>
          <Text fontSize="10px" uppercase color="neutral.c70" mb="4px">
            {t("walletSync.entryPoints.manager.title")}
          </Text>
          <Text variant="small" color="neutral.c100">
            {t("walletSync.entryPoints.manager.description")}
          </Text>
        </Flex>
      </Flex>
      <Button variant="main" outline onClick={onPress}>
        <Text color="neutral.c100">{t("walletSync.entryPoints.manager.cta")}</Text>
      </Button>
    </Flex>
  );
}
