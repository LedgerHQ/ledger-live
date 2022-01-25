// @flow

import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useNavigation, useTheme } from "@react-navigation/native";
import { ScreenName } from "../../const";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";
import Connect from "../Swap/Connect";
import MissingOrOutdatedSwapApp from "../Swap/MissingOrOutdatedSwapApp";

const forceInset = { bottom: "always" };

export default function Buy() {
  const { colors } = useTheme();
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
      style={[
        styles.root,
        {
          backgroundColor: colors.card,
          paddingTop: extraStatusBarPadding,
        },
      ]}
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
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 16,
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
