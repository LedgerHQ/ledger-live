import React from "react";
import { View, StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import Button from "../Button";
import { useSelectAccount } from "./helpers";
import { OpenModularDrawerFunction } from "LLM/features/ModularDrawer/types";
type NoAccountScreenProps = {
  manifest: AppManifest;
  currentAccountHistDb?: CurrentAccountHistDB;
  openModularDrawer?: OpenModularDrawerFunction;
};

export function NoAccountScreen({
  manifest,
  currentAccountHistDb,
  openModularDrawer,
}: NoAccountScreenProps) {
  const { onSelectAccount, onSelectAccountSuccess, currencies } = useSelectAccount({
    manifest,
    currentAccountHistDb,
  });

  const handleAddAccountPress = () => {
    if (openModularDrawer) {
      openModularDrawer({
        currencies,
        enableAccountSelection: true,
        onAccountSelected: onSelectAccountSuccess,
      });
    } else {
      onSelectAccount();
    }
  };

  return (
    <View style={styles.container}>
      <Flex flexDirection="column" alignItems="center">
        <Text variant="large" fontWeight="semiBold">
          <Trans i18nKey="webview.noAccounts.title" />
        </Text>
        <Button marginTop={10} onPress={handleAddAccountPress} type="primary">
          <Trans i18nKey="webview.noAccounts.add" />
        </Button>
      </Flex>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    marginTop: "40%",
    width: "100%",
    height: "100%",
  },
});
