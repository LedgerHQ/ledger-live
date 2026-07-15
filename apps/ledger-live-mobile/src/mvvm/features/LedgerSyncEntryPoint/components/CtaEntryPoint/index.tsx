import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { Pressable } from "react-native";

export default function CtaEntryPoint({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ marginRight: 16, opacity: pressed ? 0.7 : 1 })}
    >
      <Flex flexDirection={"row"} alignItems={"center"}>
        <Icons.Refresh size={"XS"} color="neutral.c100" />
        <Text color="neutral.c100" ml={2}>
          {t("walletSync.entryPoints.simpleCta.title")}
        </Text>
      </Flex>
    </Pressable>
  );
}
