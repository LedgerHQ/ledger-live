// @flow

import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useNavigation } from "@react-navigation/native";
import colors from "../../colors";
import { ScreenName } from "../../const";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";
import Connect from "../Swap/Connect";
import MissingOrOutdatedSwapApp from "../Swap/MissingOrOutdatedSwapApp";

const forceInset = { bottom: "always" };

export default function Buy() {
  const navigation = useNavigation();
  const [state, setState] = useState({ deviceMeta: null, exchangeApp: null });

  const onSetResult = useCallback(
    deviceMeta => {
      if (!deviceMeta) return;

      const exchangeApp = deviceMeta?.result?.installed.find(
        a => a.name === "Exchange",
      );

      setState({
        deviceMeta,
        exchangeApp,
      });

      if (exchangeApp && exchangeApp.updated) {
        navigation.navigate(ScreenName.ExchangeSelectCurrency, {
          mode: "sell",
          device: deviceMeta.device,
        });
      }
    },
    [setState],
  );

  const { deviceMeta, exchangeApp } = state;

  return (
    <SafeAreaView
      style={[styles.root, { paddingTop: extraStatusBarPadding }]}
      forceInset={forceInset}
    >
      <TrackScreen category="Sell Crypto" />
      {!deviceMeta?.result?.installed ? (
        <Connect setResult={onSetResult} />
      ) : !exchangeApp ? (
        <MissingOrOutdatedSwapApp />
      ) : !exchangeApp.updated ? (
        <MissingOrOutdatedSwapApp outdated />
      ) : null}
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
