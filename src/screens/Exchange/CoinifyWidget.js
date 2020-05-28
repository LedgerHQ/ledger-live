// @flow

import React, { useRef, useCallback, useState } from "react";
import { WebView } from "react-native-webview";
import querystring from "querystring";
import { ActivityIndicator, StyleSheet, View } from "react-native";
// $FlowFixMe
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type {
  Account,
  AccountLikeArray,
} from "@ledgerhq/live-common/lib/types";
import { useSelector } from "react-redux";
import { getConfig } from "./coinifyConfig";
import colors from "../../colors";
import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";

import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import DeviceJob from "../../components/DeviceJob";
import {
  accountApp,
  connectingStep,
  receiveVerifyStep,
} from "../../components/DeviceJob/steps";
import KeyboardView from "../../components/KeyboardView";

type Navigation = NavigationScreenProp<{ params: {} }>;

type CoinifyWidgetConfig = {
  primaryColor?: string,
  partnerId: number,
  cryptoCurrencies?: string | null,
  address?: string | null,
  targetPage: string,
  addressConfirmation?: boolean,
  transferOutMedia?: string,
  transferInMedia?: string,
};

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: Navigation,
  route: { params: RouteParams },
};

const injectedCode = `
  var originalPostMessage = window.postMessage
  window.postMessage = e => window.ReactNativeWebView.postMessage(JSON.stringify(e))

  window.addEventListener("message", event => {
      originalPostMessage(JSON.parse(event.data), "*")
  });
`;

export default function CoinifyWidget({ navigation, route }: Props) {
  const [isWaitingDeviceJob, setWaitingDeviceJob] = useState(false);
  const webView = useRef(null);
  const allAccounts = useSelector(flattenAccountsSelector);
  const accountId = route.params.accountId;
  const mode = route.params.mode;
  const meta = route.params.meta;

  const account = allAccounts.find(a => a.id === accountId);

  const coinifyConfig = getConfig("developpement");
  const widgetConfig: CoinifyWidgetConfig = {
    fontColor: colors.darkBlue,
    primaryColor: colors.live,
    partnerId: coinifyConfig.partnerId,
    cryptoCurrencies: account.currency.ticker,
    address: account.freshAddress,
    targetPage: mode,
    addressConfirmation: true,
  };

  if (mode === "buy") {
    widgetConfig.transferOutMedia = "blockchain";
  }

  if (mode === "sell") {
    widgetConfig.transferInMedia = "blockchain";
  }

  const handleMessage = useCallback(message => {
    console.log("GOT MSG", message);
    //    if (message.url !== coinifyConfig.url || !message.nativeEvent.data) return;
    message.persist();

    const { type, event, context } = JSON.parse(message.nativeEvent.data);
    if (type !== "event") return;
    switch (event) {
      case "trade.receive-account-changed":
        console.log("VERIFY PLS");
        if (context.address === account.freshAddress) {
          setWaitingDeviceJob(true);
          console.log("ADDRESS PLS");
        } else {
          // TODO this is a problem, it should not occur.
        }
        break;
    }
  }, []);

  const settleTrade = useCallback(
    status => {
      if (account && webView.current) {
        console.log("sent message to webview");
        webView.current.postMessage(
          JSON.stringify({
            type: "event",
            event: "trade.receive-account-confirmed",
            context: {
              address: account.freshAddress,
              status,
            },
          }),
        );
      }
    },
    [account],
  );

  const url = `${coinifyConfig.url}?${querystring.stringify(widgetConfig)}`;
  const forceInset = { bottom: "always" };

  return (
    <SafeAreaView
      style={[styles.root, { paddingTop: extraStatusBarPadding }]}
      forceInset={forceInset}
    >
      <WebView
        ref={webView}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
        source={{
          uri: url,
        }}
        injectedJavaScript={injectedCode}
        overScrollMode={false}
        onMessage={handleMessage}
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={{
          flex: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {isWaitingDeviceJob ? (
        <DeviceJob
          deviceModelId="nanoX" // NB: EditDeviceName feature is only available on NanoX over BLE.
          meta={meta}
          onCancel={() => {
            console.log("cancel");
            settleTrade("rejected");
            setWaitingDeviceJob(false);
          }}
          onDone={() => {
            settleTrade("accepted");
            setWaitingDeviceJob(false);
            console.log("done");
          }}
          steps={[
            connectingStep,
            accountApp(account),
            receiveVerifyStep(account),
          ]}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
