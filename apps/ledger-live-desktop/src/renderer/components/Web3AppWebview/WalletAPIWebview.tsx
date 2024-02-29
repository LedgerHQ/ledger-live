/* eslint-disable react/prop-types */

import React, {
  forwardRef,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import {
  addPendingOperation,
  getMainAccount,
  getParentAccount,
} from "@ledgerhq/live-common/account/index";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import {
  useWalletAPIServer,
  useConfig,
  UiHook,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/react";
import {
  AppManifest,
  WalletAPIServer,
  WalletAPITransaction,
} from "@ledgerhq/live-common/wallet-api/types";
import trackingWrapper, { TrackingAPI } from "@ledgerhq/live-common/wallet-api/tracking";
import { openModal } from "../../actions/modals";
import { updateAccountWithUpdater } from "../../actions/accounts";
import { flattenAccountsSelector } from "../../reducers/accounts";
import BigSpinner from "../BigSpinner";
import { setDrawer } from "~/renderer/drawers/Provider";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { track } from "~/renderer/analytics/segment";
import { shareAnalyticsSelector } from "~/renderer/reducers/settings";
import { Loader } from "./styled";
import { WebviewAPI, WebviewProps, WebviewTag } from "./types";
import { useWebviewState } from "./helpers";
import { getStoreValue, setStoreValue } from "~/renderer/store";
import { NetworkErrorScreen } from "./NetworkError";
import getUser from "~/helpers/user";
import { openExchangeDrawer } from "~/renderer/actions/UI";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { TrackFunction } from "@ledgerhq/live-common/platform/tracking";
import network from "@ledgerhq/live-network/network";
import BigNumber from "bignumber.js";
import { safeEncodeEIP55 } from "@ledgerhq/coin-evm/logic";
import { getWalletAPITransactionSignFlowInfos } from "@ledgerhq/live-common/wallet-api/converters";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getEnv } from "@ledgerhq/live-env";
import { getCryptoCurrencyById } from "@ledgerhq/coin-framework/currencies/index";
import { prepareMessageToSign } from "@ledgerhq/live-common/hw/signMessage/index";

const wallet = { name: "ledger-live-desktop", version: __APP_VERSION__ };

function useUiHook(manifest: AppManifest, tracking: Record<string, TrackFunction>): UiHook {
  const { pushToast } = useToasts();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      "account.request": ({ accounts$, currencies, onSuccess, onCancel }) => {
        setDrawer(
          SelectAccountAndCurrencyDrawer,
          {
            currencies,
            onAccountSelected: (account: AccountLike, parentAccount: Account | undefined) => {
              setDrawer();
              onSuccess(account, parentAccount);
            },
            accounts$,
          },
          {
            onRequestClose: () => {
              setDrawer();
              onCancel();
            },
          },
        );
      },
      "account.receive": ({ account, parentAccount, accountAddress, onSuccess, onError }) => {
        dispatch(
          openModal("MODAL_EXCHANGE_CRYPTO_DEVICE", {
            account,
            parentAccount,
            onResult: () => {
              onSuccess(accountAddress);
            },
            onCancel: onError,
            verifyAddress: true,
          }),
        );
      },
      "message.sign": ({ account, message, onSuccess, onError, onCancel }) => {
        dispatch(
          openModal("MODAL_SIGN_MESSAGE", {
            account,
            message,
            onConfirmationHandler: onSuccess,
            onFailHandler: onError,
            onClose: onCancel,
          }),
        );
      },
      "storage.get": ({ key, storeId }) => {
        return getStoreValue(key, storeId) as string | undefined;
      },
      "storage.set": ({ key, value, storeId }) => {
        setStoreValue(key, value, storeId);
      },
      "transaction.sign": ({
        account,
        parentAccount,
        signFlowInfos: { canEditFees, hasFeesProvided, liveTx },
        options,
        onSuccess,
        onError,
      }) => {
        dispatch(
          openModal("MODAL_SIGN_TRANSACTION", {
            canEditFees,
            stepId: canEditFees && !hasFeesProvided ? "amount" : "summary",
            transactionData: liveTx,
            useApp: options?.hwAppId,
            account,
            parentAccount,
            onResult: onSuccess,
            onCancel: onError,
            manifestId: manifest.id,
            manifestName: manifest.name,
          }),
        );
      },
      "transaction.broadcast": (account, parentAccount, mainAccount, optimisticOperation) => {
        dispatch(
          updateAccountWithUpdater(mainAccount.id, account =>
            addPendingOperation(account, optimisticOperation),
          ),
        );

        pushToast({
          id: optimisticOperation.id,
          type: "operation",
          title: t("platform.flows.broadcast.toast.title"),
          text: t("platform.flows.broadcast.toast.text"),
          icon: "info",
          callback: () => {
            tracking.broadcastOperationDetailsClick(manifest);
            setDrawer(OperationDetails, {
              operationId: optimisticOperation.id,
              accountId: account.id,
              parentId: parentAccount?.id as string | undefined | null,
            });
          },
        });
      },
      "device.transport": ({ appName, onSuccess, onCancel }) => {
        dispatch(
          openModal("MODAL_CONNECT_DEVICE", {
            appName,
            onResult: onSuccess,
            onCancel,
          }),
        );
      },
      "device.select": ({ appName, onSuccess, onCancel }) => {
        dispatch(
          openModal("MODAL_CONNECT_DEVICE", {
            appName,
            onResult: onSuccess,
            onCancel,
          }),
        );
      },
      "exchange.start": ({ exchangeType, onSuccess, onCancel }) => {
        dispatch(
          openExchangeDrawer({
            type: "EXCHANGE_START",
            exchangeType: ExchangeType[exchangeType],
            onResult: (nonce: string) => {
              onSuccess(nonce);
            },
            onCancel: (error: Error) => {
              onCancel(error);
            },
          }),
        );
      },
      "exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
        dispatch(
          openExchangeDrawer({
            type: "EXCHANGE_COMPLETE",
            ...exchangeParams,
            onResult: (operation: Operation) => {
              onSuccess(operation.hash);
            },
            onCancel: (error: Error) => {
              onCancel(error);
            },
          }),
        );
      },
    }),
    [dispatch, manifest, pushToast, t, tracking],
  );
}

const useGetUserId = () => {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    let mounted = true;
    getUser().then(({ id }) => {
      if (mounted) setUserId(id);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return userId;
};

type MessageId = number | string | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface JsonRpcRequestMessage<TParams = any> {
  jsonrpc: "2.0";
  // Optional in the request.
  id?: MessageId;
  method: string;
  params?: TParams;
}

const rejectedError = (message: string) => ({
  code: 3,
  message,
  data: [
    {
      code: 104,
      message: "Rejected",
    },
  ],
});

// TODO remove any usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertEthToLiveTX(ethTX: any): WalletAPITransaction {
  return {
    family: "ethereum",
    amount:
      ethTX.value !== undefined
        ? new BigNumber(ethTX.value.replace("0x", ""), 16)
        : new BigNumber(0),
    recipient: safeEncodeEIP55(ethTX.to),
    gasPrice:
      ethTX.gasPrice !== undefined
        ? new BigNumber(ethTX.gasPrice.replace("0x", ""), 16)
        : undefined,
    gasLimit: ethTX.gas !== undefined ? new BigNumber(ethTX.gas.replace("0x", ""), 16) : undefined,
    data: ethTX.data ? Buffer.from(ethTX.data.replace("0x", ""), "hex") : undefined,
  };
}

// Copied from https://www.npmjs.com/package/ethereumjs-util
const isHexPrefixed = (str: string): boolean => {
  if (typeof str !== "string") {
    throw new Error(`[isHexPrefixed] input must be type 'string', received type ${typeof str}`);
  }

  return str[0] === "0" && str[1] === "x";
};

// Copied from https://www.npmjs.com/package/ethereumjs-util
export const stripHexPrefix = (str: string): string => {
  if (typeof str !== "string")
    throw new Error(`[stripHexPrefix] input must be type 'string', received ${typeof str}`);

  return isHexPrefixed(str) ? str.slice(2) : str;
};

export function EVMAddressChanged(addr1: string, addr2: string): boolean {
  return addr1.toLowerCase() !== addr2.toLowerCase();
}

function useWebView(
  { manifest, customHandlers }: Pick<WebviewProps, "manifest" | "customHandlers">,
  webviewRef: RefObject<WebviewTag>,
  tracking: TrackingAPI,
  serverRef: React.MutableRefObject<WalletAPIServer | undefined>,
) {
  const accounts = useSelector(flattenAccountsSelector);

  const uiHook = useUiHook(manifest, tracking);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const userId = useGetUserId();
  const config = useConfig({
    appId: manifest.id,
    userId,
    tracking: shareAnalytics,
    wallet,
  });

  const webviewHook = useMemo(() => {
    return {
      reload: () => webviewRef.current?.reloadIgnoringCache(),
      postMessage: (message: string) => {
        console.log("PostMessage: ", message);
        const webview = webviewRef.current;
        if (webview) {
          const origin = new URL(webview.src).origin;
          webview.contentWindow?.postMessage(message, origin);
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { widgetLoaded, onLoad, onReload, onMessage, server } = useWalletAPIServer({
    manifest,
    accounts,
    tracking,
    config,
    webviewHook,
    uiHook,
    customHandlers,
  });

  useEffect(() => {
    serverRef.current = server;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server]);

  const currentNetwork = manifest.dapp?.networks[0];
  const nanoApp = manifest.dapp?.nanoApp;

  const currentAccount = useMemo(() => {
    const account = accounts.find(account => {
      if (account.type === "Account" && account.currency.id === currentNetwork?.currency) {
        return account;
      }
    });
    if (account) {
      return getParentAccount(account, accounts);
    }
  }, [accounts, currentNetwork?.currency]);

  const previousAddressRef = useRef<string>();
  const previousChainIdRef = useRef<number>();

  useEffect(() => {
    if (!currentAccount) {
      return;
    }
    if (
      previousAddressRef.current &&
      EVMAddressChanged(previousAddressRef.current, currentAccount.freshAddress)
    ) {
      webviewHook.postMessage(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "accountsChanged",
          result: [[currentAccount.freshAddress]],
        }),
      );
    }
    previousAddressRef.current = currentAccount.freshAddress;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  useEffect(() => {
    if (!currentNetwork) {
      return;
    }

    if (previousChainIdRef.current && previousChainIdRef.current !== currentNetwork.chainID) {
      webviewHook.postMessage(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "chainChanged",
          params: [`0x${currentNetwork.chainID.toString(16)}`],
        }),
      );
    }
    previousChainIdRef.current = currentNetwork.chainID;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNetwork]);

  const onDappMessage = useCallback(
    async (data: JsonRpcRequestMessage) => {
      console.log(
        data,
        currentNetwork,
        currentNetwork ? getCryptoCurrencyById(currentNetwork.currency) : undefined,
      );

      // TODO Should probably return an error specific to each case;
      if (data.jsonrpc !== "2.0" || !currentNetwork || !currentAccount) {
        return;
      }

      switch (data.method) {
        // https://eips.ethereum.org/EIPS/eip-695
        case "eth_chainId": {
          webviewHook.postMessage(
            JSON.stringify({
              id: data.id,
              jsonrpc: "2.0",
              result: `0x${currentNetwork.chainID.toString(16)}`,
            }),
          );
          break;
        }
        // https://eips.ethereum.org/EIPS/eip-1102
        // https://docs.metamask.io/guide/rpc-api.html#eth-requestaccounts
        case "eth_requestAccounts":
        // legacy method, cf. https://docs.metamask.io/guide/ethereum-provider.html#legacy-methods
        // eslint-disbale-next-line eslintno-fallthrough
        case "enable":
        // https://eips.ethereum.org/EIPS/eip-1474#eth_accounts
        // https://eth.wiki/json-rpc/API#eth_accounts
        // eslint-disbale-next-line eslintno-fallthrough
        case "eth_accounts": {
          webviewHook.postMessage(
            JSON.stringify({
              id: data.id,
              jsonrpc: "2.0",
              result: [currentAccount.freshAddress],
            }),
          );
          break;
        }

        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-3326.md
        case "wallet_switchEthereumChain": {
          const { chainId } = data.params[0];

          // Check chanId is valid hex string
          const decimalChainId = parseInt(chainId, 16);

          if (isNaN(decimalChainId)) {
            webviewHook.postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Invalid chainId"),
              }),
            );
            break;
          }

          // Check chain ID is known to the wallet
          const requestedCurrency = manifest.dapp?.networks.find(
            network => network.chainID === decimalChainId,
          );

          if (!requestedCurrency) {
            webviewHook.postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError(`Chain ID ${chainId} is not supported`),
              }),
            );
            break;
          }

          try {
            await new Promise<void>((resolve, reject) =>
              uiHook["account.request"]({
                currencies: [getCryptoCurrencyById(requestedCurrency.currency)],
                onSuccess: () => {
                  resolve();
                },
                onCancel: () => {
                  reject("User canceled");
                },
              }),
            );
            webviewHook.postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: null,
              }),
            );
          } catch (error) {
            webviewHook.postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError(`error switching chain: ${error}`),
              }),
            );
          }
          break;
        }

        // https://eth.wiki/json-rpc/API#eth_sendtransaction
        case "eth_sendTransaction": {
          const ethTX = data.params[0];
          const tx = convertEthToLiveTX(ethTX);
          if (
            currentAccount &&
            currentAccount.freshAddress.toLowerCase() === ethTX.from.toLowerCase()
          ) {
            try {
              const options = nanoApp ? { hwAppId: nanoApp } : undefined;
              void track("EVMDAppBrowser SendTransaction Init");

              const signFlowInfos = getWalletAPITransactionSignFlowInfos({
                walletApiTransaction: tx,
                account: currentAccount,
              });

              const signedTransaction = await new Promise<SignedOperation>((resolve, reject) =>
                uiHook["transaction.sign"]({
                  account: currentAccount,
                  parentAccount: undefined,
                  signFlowInfos,
                  options,
                  onSuccess: signedOperation => {
                    resolve(signedOperation);
                  },
                  onError: error => {
                    reject(error);
                  },
                }),
              );

              const bridge = getAccountBridge(currentAccount, undefined);
              const mainAccount = getMainAccount(currentAccount, undefined);

              let optimisticOperation: Operation = signedTransaction.operation;

              if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
                optimisticOperation = await bridge.broadcast({
                  account: mainAccount,
                  signedOperation: signedTransaction,
                });
              }

              uiHook["transaction.broadcast"](
                currentAccount,
                undefined,
                mainAccount,
                optimisticOperation,
              );

              void track("EVMDAppBrowser SendTransaction Success");

              webviewHook.postMessage(
                JSON.stringify({
                  id: data.id,
                  jsonrpc: "2.0",
                  result: optimisticOperation.hash,
                }),
              );
            } catch (error) {
              void track("EVMDAppBrowser SendTransaction Fail");
              webviewHook.postMessage(
                JSON.stringify({
                  id: data.id,
                  jsonrpc: "2.0",
                  error: rejectedError("Transaction declined"),
                }),
              );
            }
          }
          break;
        }
        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-191.md
        // https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign
        // https://docs.walletconnect.com/json-rpc-api-methods/ethereum
        // Discussion about the diff between eth_sign and personal_sign:
        // https://github.com/WalletConnect/walletconnect-docs/issues/32#issuecomment-644697172
        case "personal_sign": {
          try {
            /**
             * The message is received as a prefixed hex string.
             * We need to strip the "0x" prefix.
             */
            const message = stripHexPrefix(data.params[0]);
            void track("EVMDAppBrowser PersonalSign Init");

            const formattedMessage = prepareMessageToSign(currentAccount, message);

            const signedMessage = await new Promise<string>((resolve, reject) =>
              uiHook["message.sign"]({
                account: currentAccount,
                message: formattedMessage,
                onSuccess: resolve,
                onError: reject,
                onCancel: () => {
                  reject("Canceled by user");
                },
              }),
            );

            void track("EVMDAppBrowser PersonalSign Success");
            webviewHook.postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: signedMessage,
              }),
            );
          } catch (error) {
            void track("EVMDAppBrowser PersonalSign Fail");
            webviewHook.postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Personal message signed declined"),
              }),
            );
          }
          break;
        }

        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        case data.method.match(/eth_signTypedData(_v.)?$/)?.input: {
          try {
            const message = data.params[1];

            void track("EVMDAppBrowser SignTypedData Init");

            const formattedMessage = prepareMessageToSign(
              currentAccount,
              Buffer.from(message).toString("hex"),
            );

            const signedMessage = await new Promise<string>((resolve, reject) =>
              uiHook["message.sign"]({
                account: currentAccount,
                message: formattedMessage,
                onSuccess: resolve,
                onError: reject,
                onCancel: () => {
                  reject("Canceled by user");
                },
              }),
            );

            void track("EVMDAppBrowser SignTypedData Success");
            webviewHook.postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                result: signedMessage,
              }),
            );
          } catch (error) {
            void track("EVMDAppBrowser SignTypedData Fail");
            webviewHook.postMessage(
              JSON.stringify({
                id: data.id,
                jsonrpc: "2.0",
                error: rejectedError("Typed Data message signed declined"),
              }),
            );
          }
          break;
        }

        default: {
          // TODO websocket support
          // if (connector.current) {
          //   connector.current.send(data);
          // } else
          console.log("default handling", data, currentNetwork);
          if (currentNetwork.nodeURL?.startsWith("https:")) {
            void network({
              method: "POST",
              url: currentNetwork.nodeURL,
              data,
            }).then(res => {
              webviewHook.postMessage(JSON.stringify(res.data));
            });
          }
          break;
        }
      }
    },
    [currentAccount, currentNetwork, manifest.dapp?.networks, nanoApp, uiHook, webviewHook],
  );

  const handleMessage = useCallback(
    (event: Electron.IpcMessageEvent) => {
      if (event.channel === "webviewToParent") {
        onMessage(event.args[0]);
      }
      if (event.channel === "dappToParent") {
        onDappMessage(event.args[0]);
      }
    },
    [onDappMessage, onMessage],
  );

  const handleDomReady = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) {
      return;
    }

    const id = webview.getWebContentsId();

    // cf. https://gist.github.com/codebytere/409738fcb7b774387b5287db2ead2ccb
    window.api?.openWindow(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;

    if (webview) {
      webview.addEventListener("did-finish-load", onLoad);
      webview.addEventListener("ipc-message", handleMessage);
      webview.addEventListener("dom-ready", handleDomReady);
    }

    return () => {
      if (webview) {
        webview.removeEventListener("did-finish-load", onLoad);
        webview.removeEventListener("ipc-message", handleMessage);
        webview.removeEventListener("dom-ready", handleDomReady);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDomReady, handleMessage, onLoad]);

  const webviewStyle = useMemo(() => {
    return {
      opacity: widgetLoaded ? 1 : 0,
      border: "none",
      width: "100%",
      height: "100%",
      flex: 1,
      transition: "opacity 200ms ease-out",
    };
  }, [widgetLoaded]);

  return { webviewRef, widgetLoaded, onReload, webviewStyle };
}

export const WalletAPIWebview = forwardRef<WebviewAPI, WebviewProps>(
  ({ manifest, inputs = {}, customHandlers, onStateChange }, ref) => {
    const tracking = useMemo(
      () =>
        trackingWrapper(
          (
            eventName: string,
            properties?: Record<string, unknown> | null,
            mandatory?: boolean | null,
          ) =>
            track(
              eventName,
              {
                ...properties,
                flowInitiatedFrom:
                  currentRouteNameRef.current === "Platform Catalog"
                    ? "Discover"
                    : currentRouteNameRef.current,
              },
              mandatory,
            ),
        ),
      [],
    );

    const serverRef = useRef<WalletAPIServer>();

    const { webviewState, webviewRef, webviewProps, handleRefresh } = useWebviewState(
      { manifest, inputs },
      ref,
      serverRef,
    );
    useEffect(() => {
      if (onStateChange) {
        onStateChange(webviewState);
      }
    }, [webviewState, onStateChange]);

    const { webviewStyle, widgetLoaded } = useWebView(
      {
        manifest,
        customHandlers,
      },
      webviewRef,
      tracking,
      serverRef,
    );

    return (
      <>
        {!webviewState.loading && webviewState.isAppUnavailable && (
          <NetworkErrorScreen refresh={handleRefresh} />
        )}
        <webview
          ref={webviewRef}
          /**
           * There seem to be an issue between Electron webview and styled-components
           * (and React more broadly, cf. comment below).
           * When using a styled webview componennt, the `allowpopups` prop does not
           * seem to be set
           */
          style={webviewStyle}
          // eslint-disable-next-line react/no-unknown-property
          preload={`file://${window.api.appDirname}/webviewPreloader.bundle.js`}
          /**
           * There seems to be an issue between Electron webview and react
           * Hence, the normal `allowpopups` prop does not work and we need to
           * explicitly set its value to "true" as a string
           * cf. https://github.com/electron/electron/issues/6046
           */
          // @ts-expect-error: see above comment
          // eslint-disable-next-line react/no-unknown-property
          allowpopups="true"
          // eslint-disable-next-line react/no-unknown-property
          webpreferences="contextIsolation=no, nativeWindowOpen=no"
          {...webviewProps}
        />
        {!widgetLoaded ? (
          <Loader>
            <BigSpinner size={50} />
          </Loader>
        ) : null}
      </>
    );
  },
);

WalletAPIWebview.displayName = "WalletAPIWebview";
