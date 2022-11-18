import React, { ReactNode, memo } from "react";
import { StyleSheet, View } from "react-native";

const Line = ({ children }: { children: ReactNode }) => (
  <View style={styles.line}>{children}</View>
);

const styles = StyleSheet.create({
  line: {
    marginVertical: 10,
    flexDirection: "row",
    height: 40,
    alignItems: "center",
  },
});

export default memo(Line);
