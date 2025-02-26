import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import Logo from "./assets/Logo";

export default function CardEntryPoint({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onPress}>
      <Flex
        flexDirection={"row"}
        alignItems={"center"}
        bg="opacityDefault.c05"
        p={4}
        borderRadius={12}
      >
        <Flex position="relative">
          <Logo />
          <Flex
            bg="error.c60"
            height={8}
            width={8}
            borderRadius={4}
            position="absolute"
            right={0}
            bottom={0}
          />
        </Flex>
        <Flex ml={5} flexShrink={1}>
          <Text color="neutral.c70" variant="subtitle">
            {t("walletSync.entryPoints.card.title")}
          </Text>
          <Text color="neutral.c100" variant="body" mt={2}>
            {t("walletSync.entryPoints.card.description")}
          </Text>
          <Text color="primary.c80" variant="paragraph" fontWeight="semiBold" mt={3}>
            {t("walletSync.entryPoints.card.cta")}
          </Text>
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
