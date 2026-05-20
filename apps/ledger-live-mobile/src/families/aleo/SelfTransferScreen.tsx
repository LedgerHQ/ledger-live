import React from "react";
import { StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Placeholder screen for Aleo self-transfer flow.
 * Self-transfers allow converting between public and private balances.
 * This will be implemented in a future update.
 */
export function AleoSelfTransferScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <Flex
        flex={1}
        justifyContent="center"
        alignItems="center"
        px={6}
      >
        <Text
          variant="h4"
          fontWeight="semiBold"
          color="neutral.c100"
          textAlign="center"
          mb={4}
        >
          {t("aleo.selfTransfer.comingSoon.title")}
        </Text>
        <Text
          variant="paragraph"
          color="neutral.c70"
          textAlign="center"
        >
          {t("aleo.selfTransfer.comingSoon.description")}
        </Text>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
