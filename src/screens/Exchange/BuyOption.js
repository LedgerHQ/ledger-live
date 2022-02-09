// @flow

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import ProviderBullet from "./ProviderBullet";

type BuyOptionProps = {
  name: string,
  icon: React$Node,
  supportedCoinsCount: number,
  onPress: Function,
  isActive: boolean,
};

export default function BuyOption(props: BuyOptionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { icon, name, supportedCoinsCount, onPress, isActive } = props;

  return (
    <TouchableOpacity
      style={[
        styles.body,
        {
          borderColor: isActive ? colors.live : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.icon}>{icon}</View>
        <LText semiBold style={styles.name}>
          {name}
        </LText>
      </View>
      <ProviderBullet text={t("exchange.buy.bullets.whereToBuy")} />
      <ProviderBullet
        text={`${supportedCoinsCount}+ ${t(
          "exchange.buy.bullets.cryptoSupported",
        )}`}
      />
      <ProviderBullet text={t("exchange.buy.bullets.payWith")} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    minWidth: "100%",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "transparent",
    padding: 20,
    marginTop: 16,
  },
  header: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 18,
  },
  icon: {
    width: 40,
    height: 40,
  },
  name: {
    marginLeft: 12,
    fontSize: 16,
  },
  bullet: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  bulletIcon: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  bulletText: {
    fontSize: 14,
    marginLeft: 7,
  },
});
