import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, View } from "react-native";
import Spinning from "~/components/Spinning";
import LiveLogo from "~/icons/LiveLogoIcon";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

const PendingContainer = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <Spinning>
        <LiveLogo color={colors.grey} size={32} />
      </Spinning>

      {children}
    </View>
  );
};

export default PendingContainer;
