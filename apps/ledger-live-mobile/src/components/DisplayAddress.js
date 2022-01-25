// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { useTheme } from "@react-navigation/native";
import LText from "./LText/index";
import { rgba } from "../colors";

type Props = {
  address: string,
  verified?: boolean,
};

function DisplayAddress({ address, verified = false }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.fog },
        verified
          ? {
              borderColor: colors.success,
              backgroundColor: rgba(colors.success, 0.03),
            }
          : undefined,
      ]}
    >
      <LText bold style={styles.text} selectable>
        {address}
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 4,
    borderStyle: "dashed",
  },
  text: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default memo<Props>(DisplayAddress);
