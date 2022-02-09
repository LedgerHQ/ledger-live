// @flow

import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { NavigatorName } from "../../const";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";
import LText from "../../components/LText";
import ExchangeIcon from "../../icons/Exchange";
import Button from "../../components/Button";
import PoweredByCoinify from "./PoweredByCoinify";

const forceInset = { bottom: "always" };

export default function Coinify() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const onCTAClick = useCallback(() => {
    navigation.navigate(NavigatorName.ExchangeBuyFlow, {
      mode: "buy",
    });
  }, [navigation]);

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.card,
          paddingTop: extraStatusBarPadding,
        },
      ]}
      forceInset={forceInset}
    >
      <TrackScreen category="Buy Crypto" />
      <View style={styles.body}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.lightLive }]}
        >
          <ExchangeIcon size={22} color={colors.live} />
        </View>
        <LText style={styles.title} semiBold>
          {t("exchange.buy.coinifyTitle")}
        </LText>
        <LText style={styles.description} color="smoke">
          {t("exchange.buy.description")}
        </LText>
        <View style={styles.buttonContainer}>
          <Button
            containerStyle={styles.button}
            event="ExchangeStartBuyFlow"
            type="primary"
            title={t("exchange.buy.CTAButton")}
            onPress={() => onCTAClick()}
          />
        </View>
      </View>
      <PoweredByCoinify />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 50,
    marginBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    fontSize: 14,
  },
  buttonContainer: {
    paddingTop: 24,
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: "row",
  },
  button: {
    flex: 1,
  },
});
