// @flow

import React, { useRef, useCallback, useState } from "react";
import { WebView } from "react-native-webview";
import querystring from "querystring";
import { ActivityIndicator, StyleSheet, View } from "react-native";
// $FlowFixMe
import { SafeAreaView } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { getConfig } from "./coinifyConfig";
import colors from "../../colors";

import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import DeviceJob from "../../components/DeviceJob";
import {
  accountApp,
  connectingStep,
  verifyAddressOnDeviceStep,
} from "../../components/DeviceJob/steps";

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

const injectedCode = `
  var originalPostMessage = window.postMessage
  window.postMessage = e => window.ReactNativeWebView.postMessage(JSON.stringify(e))

  window.addEventListener("message", event => {
      originalPostMessage(JSON.parse(event.data), "*")
  });
`;

type Props = {
  account?: Account,
  mode: string,
  meta?: *,
};

export default function CoinifyWidget({ mode, account, meta }: Props) {
  const [isWaitingDeviceJob, setWaitingDeviceJob] = useState(false);
  const webView = useRef(null);

  const coinifyConfig = getConfig();
  const widgetConfig: CoinifyWidgetConfig = {
    fontColor: colors.darkBlue,
    primaryColor: colors.live,
    partnerId: coinifyConfig.partnerId,
    targetPage: mode,
    addressConfirmation: true,
  };

  if (mode === "buy") {
    widgetConfig.transferOutMedia = "blockchain";
    widgetConfig.cryptoCurrencies = account.currency.ticker;
    widgetConfig.address = account.freshAddress;
  }

  if (mode === "sell") {
    widgetConfig.transferInMedia = "blockchain";
    widgetConfig.cryptoCurrencies = account.currency.ticker;
    widgetConfig.address = account.freshAddress;
  }

  if (mode === "trade-history") {
    widgetConfig.transferOutMedia = "";
    widgetConfig.transferInMedia = "";
  }

  const handleMessage = useCallback(message => {
    //    if (message.url !== coinifyConfig.url || !message.nativeEvent.data) return;
    message.persist();

    const { type, event, context } = JSON.parse(message.nativeEvent.data);
    if (type !== "event") return;
    if (event === "trade.receive-account-changed") {
      if (context.address === account.freshAddress) {
        setWaitingDeviceJob(true);
      } else {
        // TODO this is a problem, it should not occur.
      }
    }
  }, []);

  const settleTrade = useCallback(
    status => {
      if (account && webView.current) {
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
            settleTrade("rejected");
            setWaitingDeviceJob(false);
          }}
          onDone={() => {
            settleTrade("accepted");
            setWaitingDeviceJob(false);
          }}
          steps={[
            connectingStep,
            accountApp(account),
            verifyAddressOnDeviceStep(account),
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
