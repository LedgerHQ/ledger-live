// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import colors from "../../colors";
import { NavigatorName } from "../../const";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";
import LText from "../../components/LText";
import ExchangeIcon from "../../icons/Exchange";
import Button from "../../components/Button";

const forceInset = { bottom: "always" };

export default function ExchangeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <SafeAreaView
      style={[styles.root, { paddingTop: extraStatusBarPadding }]}
      forceInset={forceInset}
    >
      <TrackScreen category="Buy Crypto" />
      <View style={styles.body}>
        <View style={styles.iconContainer}>
          <ExchangeIcon size={22} color={colors.live} />
        </View>
        <LText style={styles.title} semiBold>
          {t("exchange.buy.title")}
        </LText>
        <LText style={styles.description}>
          {t("exchange.buy.description")}
        </LText>
        <View style={styles.buttonContainer}>
          <Button
            containerStyle={styles.button}
            event="ExchangeStartBuyFlow"
            type="primary"
            title={t("exchange.buy.CTAButton")}
            onPress={() => navigation.navigate(NavigatorName.ExchangeBuyFlow)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
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
    backgroundColor: colors.lightLive,
    marginBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 16,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    color: colors.smoke,
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
