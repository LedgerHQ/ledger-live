import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "~/context/Locale";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { SetCurrentAccountHistDb } from "@ledgerhq/live-common/wallet-api/react";
import Button from "../Button";
import { useSelectAccount } from "./helpers";

type NoAccountScreenProps = {
  manifest: AppManifest;
  setCurrentAccountHistDb: SetCurrentAccountHistDb;
};

export function NoAccountScreen({ manifest, setCurrentAccountHistDb }: NoAccountScreenProps) {
  const { handleAddAccountPress } = useSelectAccount({
    manifest,
    setCurrentAccountHistDb,
  });

  useEffect(() => {
    handleAddAccountPress();
  }, [handleAddAccountPress]);

  return (
    <View style={styles.container}>
      <Flex flexDirection="column" alignItems="center">
        <Text variant="large" fontWeight="semiBold">
          <Trans i18nKey="webview.noAccounts.title" />
        </Text>
        <Button marginTop={10} onPress={handleAddAccountPress} type="primary">
          <Trans i18nKey="webview.noAccounts.select" />
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
