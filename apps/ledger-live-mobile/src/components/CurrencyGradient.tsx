import React, { memo, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { ensureContrast } from "../colors";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "@ledgerhq/lumen-ui-rnative";

const CurrencyGradient = ({ gradientColor }: { gradientColor: string }) => {
  const { colors } = useTheme();
  const contrasted = useMemo(
    () => ensureContrast(gradientColor, colors.background.main),
    [gradientColor, colors.background.main],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      <LinearGradient
        stops={[
          { color: contrasted, opacity: 0.3 },
          { color: contrasted, opacity: 0 },
        ]}
        style={styles.gradient}
      />

      <LinearGradient
        stops={[
          { color: colors.background.main, opacity: 0 },
          { color: colors.background.main, opacity: 1 },
        ]}
        style={styles.gradient}
      />
    </View>
  );
};

export default memo(CurrencyGradient);

const styles = StyleSheet.create({
  container: {
    width: 850,
    height: 454,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
  },
});
