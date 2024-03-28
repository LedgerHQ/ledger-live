import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import Button from "../Button";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useSelectAccount } from "./helpers";

type Props = {
  manifest: AppManifest;
  currentAccountHistDb?: CurrentAccountHistDB;
};

export function NoAccountScreen({ manifest, currentAccountHistDb }: Props) {
  const { onSelectAccount } = useSelectAccount({ manifest, currentAccountHistDb });

  return (
    <View style={styles.overlay}>
      <Flex flexDirection="column" alignItems="center">
        <Text variant="large" fontWeight="semiBold">
          <Trans i18nKey="webview.noAccounts.title" />
        </Text>
        <Button marginTop={10} onPress={onSelectAccount} type="primary">
          <Trans i18nKey="webview.noAccounts.add" />
        </Button>
      </Flex>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    display: "flex",
    marginTop: "40%",
    width: "100%",
    height: "100%",
  },
});
