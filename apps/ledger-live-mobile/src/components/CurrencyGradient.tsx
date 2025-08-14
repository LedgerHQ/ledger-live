import React, { memo, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { ensureContrast } from "../colors";
import LinearGradient from "react-native-linear-gradient";
import { StyleSheet, View } from "react-native";
import { rgba } from "@ledgerhq/native-ui";

const CurrencyGradient = ({ gradientColor }: { gradientColor: string }) => {
  const { colors } = useTheme();
  const contrasted = useMemo(
    () => ensureContrast(gradientColor, colors.background.main),
    [gradientColor, colors.background.main],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      <LinearGradient
        colors={[rgba(contrasted, 0.3), rgba(contrasted, 0)]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <LinearGradient
        colors={[`${colors.background.main}00`, colors.background.main]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
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
