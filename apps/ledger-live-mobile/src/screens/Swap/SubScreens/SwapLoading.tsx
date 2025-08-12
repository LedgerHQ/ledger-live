import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Loading } from "../Loading";

export default function SwapLoading() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Flex flex={1} justifyContent="center" alignItems="center" px={6}>
        <Loading size={60} />
        <Text variant="h4" textAlign="center" mt={8} mb={4}>
          {t("swap.loading.title", "Processing Exchange")}
        </Text>
        <Text variant="bodyLineHeight" textAlign="center" color="neutral.c70">
          {t("swap.loading.description", "Please wait while we process your exchange. This may take a few moments...")}
        </Text>
      </Flex>
    </SafeAreaView>
  );
}
