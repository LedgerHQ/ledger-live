// @flow

import React, { useRef, useCallback, useState, useEffect } from "react";
import { WebView } from "react-native-webview";
import querystring from "querystring";
import { ActivityIndicator, StyleSheet, View, Linking } from "react-native";
// $FlowFixMe
import type { Account } from "@ledgerhq/live-common/lib/types";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import { getConfig } from "./coinifyConfig";
import colors from "../../colors";
import DeviceJob from "../../components/DeviceJob";
import {
  accountApp,
  connectingStep,
  verifyAddressOnDeviceStep,
} from "../../components/DeviceJob/steps";
import { track } from "../../analytics";

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

  document.addEventListener("message", event => {
      originalPostMessage(JSON.parse(event.data), "*");
  });

  window.addEventListener("message", event => {
      originalPostMessage(JSON.parse(event.data), "*");
  });
  
  function getExternalLink(domNode) {
    let curNode = domNode;

    while (curNode) {
       if (curNode.tagName === "A" && curNode.target === "_blank")
          return curNode;
       else
          curNode = curNode.parentNode;
    }
    return null;
  }
  
  document.addEventListener('click', event => {
    const externalLink = getExternalLink(event.target)
    if (externalLink) {
      window.postMessage({
        type: "event",
        event: "misc.opened-external-link",
        context: {
          url: externalLink.href
        },
      });
      event.preventDefault();
    }
  }, false);
`;

type Props = {
  account?: Account,
  mode: string,
  meta?: *,
};

export default function CoinifyWidget({ mode, account, meta }: Props) {
  const [isWaitingDeviceJob, setWaitingDeviceJob] = useState(false);
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const webView = useRef(null);

  const coinifyConfig = getConfig();
  const widgetConfig: CoinifyWidgetConfig = {
    fontColor: colors.darkBlue,
    primaryColor: colors.live,
    partnerId: coinifyConfig.partnerId,
    targetPage: mode,
    addressConfirmation: true,
  };

  useEffect(() => {
    if (mode === "buy" && account) {
      track("Coinify Start Buy Widget", {
        currencyName: getAccountCurrency(account).name,
      });
    }
    if (mode === "sell" && account) {
      track("Coinify Start Sell Widget", {
        currencyName: getAccountCurrency(account).name,
      });
    }
    if (mode === "trade-history") {
      track("Coinify Start History Widget");
    }
  }, [account, mode]);

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
    const { type, event, context } = JSON.parse(message.nativeEvent.data);
    if (type !== "event") return;
    if (event === "misc.opened-external-link") {
      if (Linking.canOpenURL(context.url)) {
        Linking.openURL(context.url);
      }
    }
    if (event === "trade.receive-account-changed") {
      if (context.address === account.freshAddress) {
        track("Coinify Confirm Buy Start", {
          currencyName: getAccountCurrency(account).name,
        });
        setWaitingDeviceJob(true);
      } else {
        // TODO this is a problem, it should not occur.
      }
    }
    if (event === "trade.trade-placed") {
      track("Coinify Widget Event Trade Placed", {
        currencyName: getAccountCurrency(account).name,
      });
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
        if (status === "accepted") {
          track("Coinify Confirm Buy End", {
            currencyName: getAccountCurrency(account).name,
          });
        }
      }
    },
    [account],
  );

  const url = `${coinifyConfig.url}?${querystring.stringify(widgetConfig)}`;

  return (
    <View style={[styles.root]}>
      <WebView
        ref={webView}
        startInLoadingState={true}
        renderLoading={() =>
          !firstLoadDone ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          ) : null
        }
        originWhitelist={["https://*.coinify.com"]}
        allowsInlineMediaPlayback
        source={{
          uri: url,
        }}
        onLoad={() => setFirstLoadDone(true)}
        injectedJavaScript={injectedCode}
        onMessage={handleMessage}
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFitmediaPlaybackRequiresUserAction
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
    </View>
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
