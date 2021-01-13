// @flow
import React, { useCallback, useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import querystring from "querystring";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account/helpers";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/app";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import DeviceAction from "../../components/DeviceAction";
import BottomModal from "../../components/BottomModal";
import { renderVerifyAddress } from "../../components/DeviceAction/rendering";
import { getConfig } from "./coinifyConfig";
import { track } from "../../analytics";
import { DevicePart } from "./DevicePart";

const action = createAction(connectApp);

type CoinifyWidgetConfig = {
  primaryColor?: string,
  partnerId: number,
  cryptoCurrencies?: string | null,
  address?: string | null,
  targetPage: string,
  addressConfirmation?: boolean,
  transferOutMedia?: string,
  transferInMedia?: string,
  confirmMessages?: *,
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
  account?: AccountLike,
  parentAccount: ?Account,
  mode: string,
  device: Device,
  verifyAddress?: boolean,
};

let tradeId = null;
let resolvePromise = null;
export default function CoinifyWidget({
  mode,
  account,
  parentAccount,
  device,
}: Props) {
  const { colors } = useTheme();
  const [requestingAction, setRequestingAction] = useState<
    "none" | "connect" | "verify",
  >("none");
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const webView = useRef();

  const currency = account ? getAccountCurrency(account) : null;
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;

  const coinifyConfig = getConfig();

  const widgetConfig: CoinifyWidgetConfig = {
    fontColor: "#142533",
    primaryColor: colors.live,
    partnerId: coinifyConfig.partnerId,
    cryptoCurrencies: currency ? currency.ticker : null,
    address: mainAccount ? mainAccount.freshAddress : null,
    targetPage: mode,
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
    widgetConfig.addressConfirmation = true;
  }

  if (mode === "sell") {
    widgetConfig.transferInMedia = "blockchain";
    widgetConfig.confirmMessages = true;
  }

  if (mode === "trade-history") {
    widgetConfig.transferOutMedia = "";
    widgetConfig.transferInMedia = "";
  }

  const handleMessage = useCallback(message => {
    const { type, event, context } = JSON.parse(message.nativeEvent.data);

    if (type !== "event") {
      return;
    }
    switch (event) {
      case "misc.opened-external-link":
        if (Linking.canOpenURL(context.url)) {
          Linking.openURL(context.url);
        }
        break;
      case "trade.receive-account-changed":
        if (context.address === mainAccount?.freshAddress) {
          track("Coinify Confirm Buy Start", {
            currencyName: account && getAccountCurrency(account).name,
          });
          setRequestingAction("connect");
          setIsOpen(true);
        } else {
          // TODO this is a problem, it should not occur.
        }
        break;
      case "trade.trade-placed":
        track("Coinify Widget Event Trade Placed", {
          currencyName: account && getAccountCurrency(account).name,
        });
        break;
      case "trade.trade-prepared":
        if (mode === "sell" && currency) {
          setRequestingAction("connect");
          setIsOpen(true);
        }
        break;
      case "trade.trade-created":
        if (mode === "sell") {
          //            setTradeId(context.id);
          tradeId = context.id;
          if (resolvePromise) {
            resolvePromise(context);
            resolvePromise = null;
          }
        }
        break;
      default:
        break;
    }
  }, []);

  const setTransactionId = useCallback(
    txId =>
      new Promise(resolve => {
        resolvePromise = resolve;
        if (webView.current) {
          webView.current.postMessage(
            JSON.stringify({
              type: "event",
              event: "settings.partner-context-changed",
              context: {
                partnerContext: {
                  nonce: txId,
                },
              },
            }),
          );
          webView.current.postMessage(
            JSON.stringify({
              type: "event",
              event: "trade.confirm-trade-prepared",
              context: {
                confirmed: true,
              },
            }),
          );
        }
      }),
    [coinifyConfig],
  );

  const settleTrade = useCallback(
    confirmed => {
      setIsOpen(false);
      setRequestingAction("none");
      if (account && webView.current) {
        if (mode === "buy") {
          webView.current.postMessage(
            JSON.stringify({
              type: "event",
              event: "trade.receive-account-confirmed",
              context: {
                address: mainAccount?.freshAddress,
                status: confirmed ? "accepted" : "rejected",
              },
            }),
          );
          if (confirmed) {
            track("Coinify Confirm Buy End", {
              currencyName: getAccountCurrency(account).name,
            });
          }
        } else {
          webView.current.postMessage(
            JSON.stringify({
              type: "event",
              event: "trade.confirm-trade-created",
              context: {
                confirmed,
                transferInitiated: true,
                tradeId,
              },
            }),
          );
          if (confirmed) {
            track("Coinify Confirm Sell End", {
              currencyName: getAccountCurrency(account).name,
            });
          }
        }
      }
    },
    [account, mode],
  );

  const onResult = useCallback(() => {
    setRequestingAction("verify");
  }, []);

  const tokenCurrency =
    account && account.type === "TokenAccount" ? account.token : null;

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
        originWhitelist={["https://*"]}
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
        style={styles.webview}
        androidHardwareAccelerationDisabled
      />
      <BottomModal id="DeviceActionModal" isOpened={isOpen}>
        <View style={styles.modalContainer}>
          {requestingAction === "connect" ? (
            mode === "buy" ? (
              <DeviceAction
                action={action}
                device={device}
                request={{ account: mainAccount, tokenCurrency }}
                onResult={onResult}
              />
            ) : (
              <DevicePart
                account={account}
                onResult={settleTrade}
                device={device}
                parentAccount={parentAccount}
                getCoinifyContext={setTransactionId}
              />
            )
          ) : requestingAction === "verify" ? (
            <VerifyAddress
              account={mainAccount}
              device={device}
              onResult={settleTrade}
            />
          ) : null}
        </View>
      </BottomModal>
    </View>
  );
}

function VerifyAddress({
  account,
  device,
  onResult,
}: {
  account: Account,
  device: Device,
  onResult: (confirmed: boolean, error?: Error) => void,
}) {
  const { dark } = useTheme();
  const { t } = useTranslation();

  const onConfirmAddress = useCallback(async () => {
    try {
      await getAccountBridge(account)
        .receive(account, {
          deviceId: device.deviceId,
          verify: true,
        })
        .toPromise();
      onResult(true);
    } catch (err) {
      onResult(false, err);
    }
  }, [account, device, onResult]);

  useEffect(() => {
    onConfirmAddress();
  }, [onConfirmAddress]);

  return renderVerifyAddress({
    t,
    currencyName: getAccountCurrency(account).name,
    device,
    address: account.freshAddress,
    theme: dark ? "dark" : "light",
  });
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  modalContainer: {
    flexDirection: "row",
  },
  webview: {
    flex: 0,
    width: "100%",
    height: "100%",
  },
});
