import React from "react";
import { View } from "react-native";
import { Spot } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

export function LoadingState() {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacings.s24,
      },
    }),
    [],
  );

  return (
    <View style={styles.container}>
      <Spot appearance="loader" size={72} />
    </View>
  );
}
