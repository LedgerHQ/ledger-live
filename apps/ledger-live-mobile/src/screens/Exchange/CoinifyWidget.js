// @flow
import React, { useCallback, useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import querystring from "querystring";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/helpers";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import DeviceAction from "../../components/DeviceAction";
import BottomModal from "../../components/BottomModal";
import { renderVerifyAddress } from "../../components/DeviceAction/rendering";
import { getConfig } from "./coinifyConfig";
import { track } from "../../analytics";
import { DevicePart } from "./DevicePart";
import SkipDeviceVerification from "./SkipDeviceVerification";

const action = createAction(connectApp);

type CoinifyWidgetConfig = {
  primaryColor?: string,
  partnerId: string,
  cryptoCurrencies?: string | null,
  address?: string | null,
  targetPage: string,
  confirmMessages?: boolean,
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
  parentAccount?: ?Account,
  mode: string,
  device?: Device,
  verifyAddress?: boolean,
  skipDevice?: Boolean,
};

let resolvePromise = null;
export default function CoinifyWidget({
  mode,
  account,
  parentAccount,
  device,
  skipDevice,
}: Props) {
  const tradeId = useRef(null);
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
    widgetConfig.confirmMessages = true;
  }

  if (mode === "sell") {
    widgetConfig.transferInMedia = "blockchain";
    widgetConfig.confirmMessages = true;
  }

  if (mode === "trade-history") {
    widgetConfig.transferOutMedia = "";
    widgetConfig.transferInMedia = "";
  }

  const handleMessage = useCallback(
    message => {
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
          tradeId.current = context.id;
          if (mode === "sell") {
            if (resolvePromise) {
              resolvePromise(context);
              resolvePromise = null;
            }
          }
          if (mode === "buy") {
            webView?.current?.postMessage(
              JSON.stringify({
                type: "event",
                event: "trade.confirm-trade-created",
                context: {
                  confirmed: true,
                  tradeId: tradeId.current,
                },
              }),
            );
            track("Coinify Confirm Buy End", {
              currencyName: account && getAccountCurrency(account).name,
              medium: context?.transferIn?.medium,
            });
          }
          break;
        default:
          break;
      }
    },
    [currency, account, mainAccount, mode],
  );

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
    [],
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
              event: "trade.confirm-trade-prepared",
              context: {
                address: mainAccount?.freshAddress,
                confirmed,
              },
            }),
          );
        } else {
          webView.current.postMessage(
            JSON.stringify({
              type: "event",
              event: "trade.confirm-trade-created",
              context: {
                confirmed,
                transferInitiated: true,
                tradeId: tradeId.current,
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
    [account, mode, mainAccount?.freshAddress],
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
        // $FlowFixMe
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
          {requestingAction === "connect" && mainAccount ? (
            mode === "buy" && device && !skipDevice ? (
              <DeviceAction
                action={action}
                device={device}
                request={{ account: mainAccount, tokenCurrency }}
                onResult={onResult}
                analyticsPropertyFlow="buy"
              />
            ) : mode === "buy" ? (
              <SkipDeviceVerification
                account={mainAccount}
                settleTrade={settleTrade}
              />
            ) : account ? (
              <DevicePart
                account={account}
                onResult={settleTrade}
                device={device}
                parentAccount={parentAccount}
                getCoinifyContext={setTransactionId}
              />
            ) : null
          ) : requestingAction === "verify" && mainAccount ? (
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
  device: ?Device,
  onResult: (confirmed: boolean, error?: Error) => void,
}) {
  const { dark } = useTheme();
  const { t } = useTranslation();

  const onConfirmAddress = useCallback(async () => {
    try {
      if (!device) return;
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

  if (!device) return null;

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
    /**
     * This is required to prevent a crash when navigating back.
     * The issue is caused by an incompatibility between the
     * react-native-webview and react-native-screens packages.
     * See: https://github.com/react-native-webview/react-native-webview/issues/1069
     * See: https://github.com/software-mansion/react-native-screens/issues/105
     */
    opacity: 0.99,
  },
});
