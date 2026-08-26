import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import TranslatedError from "~/components/TranslatedError";

type Props = {
  error: Error | null | undefined;
};

export default function ValidatorsFetchError({ error }: Readonly<Props>) {
  return (
    <View style={styles.container}>
      <Text typography="body2" lx={{ color: "error", textAlign: "center" }}>
        <TranslatedError error={error} />
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
