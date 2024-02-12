import { useTheme } from "@react-navigation/native";
import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import LText from "~/components/LText";

export const EvmNetworkFeeInfo = () => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={styles.root}>
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: colors.lightLive,
          },
        ]}
      >
        <Icon name="info" size={32} color={colors.live} />
      </View>
      <View style={styles.textWrapper}>
        <LText secondary bold style={styles.textTitle}>
          <Trans i18nKey="send.fees.titleMaxFees" />
        </LText>
        <LText style={styles.textContent} color="smoke">
          <Trans i18nKey="send.fees.networkInfoMaxFees" />
        </LText>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 56,
    height: 56,
    borderRadius: 56,
  },
  textWrapper: {
    marginTop: 16,
    alignItems: "center",
  },
  textTitle: {
    fontSize: 16,
  },
  textContent: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
});
