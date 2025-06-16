import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

export default function CtaEntryPoint({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onPress} style={{ marginRight: 16 }}>
      <Flex flexDirection={"row"} alignItems={"center"}>
        <Icons.Refresh size={"XS"} color="neutral.c100" />
        <Text color="neutral.c100" ml={2}>
          {t("walletSync.entryPoints.simpleCta.title")}
        </Text>
      </Flex>
    </TouchableOpacity>
  );
}
