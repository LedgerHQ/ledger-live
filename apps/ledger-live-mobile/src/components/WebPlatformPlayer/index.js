// @flow
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useTheme } from "@react-navigation/native";
import Color from "color";
import { JSONRPCRequest } from "json-rpc-2.0";
import {
  RawPlatformTransaction,
  RawPlatformSignedTransaction,
} from "@ledgerhq/live-common/platform/rawTypes";

import { getEnv } from "@ledgerhq/live-common/env";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getMainAccount,
  isTokenAccount,
  flattenAccounts,
} from "@ledgerhq/live-common/account/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  findCryptoCurrencyById,
  listAndFilterCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import type { AppManifest } from "@ledgerhq/live-common/platform/types";

import { useJSONRPCServer } from "@ledgerhq/live-common/platform/JSONRPCServer";
import {
  accountToPlatformAccount,
  getPlatformTransactionSignFlowInfos,
} from "@ledgerhq/live-common/platform/converters";
import {
  serializePlatformAccount,
  deserializePlatformTransaction,
  serializePlatformSignedTransaction,
  deserializePlatformSignedTransaction,
} from "@ledgerhq/live-common/platform/serializers";
import {
  useListPlatformAccounts,
  useListPlatformCurrencies,
  usePlatformUrl,
} from "@ledgerhq/live-common/platform/react";
import { NavigatorName, ScreenName } from "../../const";
import { broadcastSignedTx } from "../../logic/screenTransactionHooks";
import { accountsSelector } from "../../reducers/accounts";
import UpdateIcon from "../../icons/Update";
import InfoIcon from "../../icons/Info";
import InfoPanel from "./InfoPanel";
import * as tracking from "./tracking";

type Props = {
  manifest: AppManifest,
  inputs?: Object,
};

const ReloadButton = ({
  onReload,
  loading,
}: {
  onReload: Function,
  loading: boolean,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.buttons}
      disabled={loading}
      onPress={() => !loading && onReload()}
    >
      <UpdateIcon size={18} color={colors.grey} />
    </TouchableOpacity>
  );
};

const InfoPanelButton = ({
  loading,
  setIsInfoPanelOpened,
}: {
  loading: boolean,
  setIsInfoPanelOpened: (isInfoPanelOpened: boolean) => void,
}) => {
  const { colors } = useTheme();

  const onPress = () => {
    setIsInfoPanelOpened(true);
  };

  return (
    <TouchableOpacity
      style={styles.buttons}
      disabled={loading}
      onPress={onPress}
    >
      <InfoIcon size={18} color={colors.grey} />
    </TouchableOpacity>
  );
};

const WebPlatformPlayer = ({ manifest, inputs }: Props) => {
  const targetRef: { current: null | WebView } = useRef(null);
  const accounts = flattenAccounts(useSelector(accountsSelector));
  const theme = useTheme();
  const navigation = useNavigation();

  const [loadDate, setLoadDate] = useState(Date.now());
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);

  const [device, setDevice] = useState();

  const uri = usePlatformUrl(
    manifest,
    {
      background: new Color(theme.colors.card).hex(),
      text: new Color(theme.colors.text).hex(),
      loadDate,
    },
    inputs,
  );

  const listAccounts = useListPlatformAccounts(accounts);
  const listPlatformCurrencies = useListPlatformCurrencies();

  const requestAccount = useCallback(
    ({
      currencies: currencyIds,
      allowAddAccount = true,
      includeTokens,
    }: // TODO: use type RequestAccountParams from LedgerLiveApiSdk
    // }: RequestAccountParams) =>
    {
      currencies?: string[],
      allowAddAccount?: boolean,
      includeTokens?: boolean,
    }) =>
      new Promise((resolve, reject) => {
        tracking.platformRequestAccountRequested(manifest);

        const allCurrencies = listAndFilterCurrencies({
          currencies: currencyIds,
          includeTokens,
        });
        // handle no curencies selected case
        const cryptoCurrencyIds =
          currencyIds && currencyIds.length > 0
            ? currencyIds
            : allCurrencies.map(({ id }) => id);

        const foundAccounts = cryptoCurrencyIds?.length
          ? accounts.filter(a =>
              cryptoCurrencyIds.includes(
                isTokenAccount(a) ? a.token.id : a.currency.id,
              ),
            )
          : accounts;

        // @TODO replace with correct error
        if (foundAccounts.length <= 0 && !allowAddAccount) {
          tracking.platformRequestAccountFail(manifest);
          reject(new Error("No accounts found matching request"));
          return;
        }

        // list of queried cryptoCurrencies with one or more accounts -> used in case of not allowAddAccount and multiple accounts selectable
        const currenciesDiff = allowAddAccount
          ? cryptoCurrencyIds
          : foundAccounts
              .map(a => (isTokenAccount(a) ? a.token.id : a.currency.id))
              .filter(
                (c, i, arr) =>
                  cryptoCurrencyIds.includes(c) && i === arr.indexOf(c),
              );

        // if single currency available redirect to select account directly
        if (currenciesDiff.length === 1) {
          const currency = findCryptoCurrencyById(currenciesDiff[0]);
          if (!currency) {
            tracking.platformRequestAccountFail(manifest);
            // @TODO replace with correct error
            reject(new Error("Currency not found"));
            return;
          }
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectAccount,
            params: {
              currencies: allCurrencies,
              currency,
              allowAddAccount,
              includeTokens,
              onSuccess: (account, parentAccount) => {
                tracking.platformRequestAccountSuccess(manifest);
                resolve(
                  serializePlatformAccount(
                    accountToPlatformAccount(account, parentAccount),
                  ),
                );
              },
              onError: error => {
                tracking.platformRequestAccountFail(manifest);
                reject(error);
              },
            },
          });
        } else {
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectCrypto,
            params: {
              currencies: allCurrencies,
              allowAddAccount,
              includeTokens,
              onSuccess: (account, parentAccount) => {
                tracking.platformRequestAccountSuccess(manifest);
                resolve(
                  serializePlatformAccount(
                    accountToPlatformAccount(account, parentAccount),
                  ),
                );
              },
              onError: error => {
                tracking.platformRequestAccountFail(manifest);
                reject(error);
              },
            },
          });
        }
      }),
    [manifest, accounts, navigation],
  );

  const receiveOnAccount = useCallback(
    ({ accountId }: { accountId: string }) => {
      tracking.platformReceiveRequested(manifest);
      const account = accounts.find(account => account.id === accountId);

      return new Promise((resolve, reject) => {
        if (!account) {
          tracking.platformReceiveFail(manifest);
          reject(new Error("Account required"));
          return;
        }

        navigation.navigate(ScreenName.VerifyAccount, {
          account,
          onSuccess: account => {
            tracking.platformReceiveSuccess(manifest);
            resolve(account.freshAddress);
          },
          onClose: () => {
            tracking.platformReceiveFail(manifest);
            reject(new Error("User cancelled"));
          },
          onError: e => {
            tracking.platformReceiveFail(manifest);
            // @TODO put in correct error text maybe
            reject(e);
          },
        });
      });
    },
    [manifest, accounts, navigation],
  );

  const signTransaction = useCallback(
    ({
      accountId,
      transaction,
      params = {},
    }: // TODO: use type SignTransactionParams from LedgerLiveApiSdk
    // }: SignTransactionParams) => {
    {
      accountId: string,
      transaction: RawPlatformTransaction,
      params: any,
    }) => {
      const platformTransaction = deserializePlatformTransaction(transaction);
      const account = accounts.find(account => account.id === accountId);

      tracking.platformSignTransactionRequested(manifest);

      if (!account) {
        tracking.platformSignTransactionFail(manifest);
        return Promise.reject(new Error("Account required"));
      }

      const parentAccount = isTokenAccount(account)
        ? accounts.find(a => a.id === account.parentId)
        : undefined;

      if (
        (isTokenAccount(account)
          ? parentAccount?.currency.family
          : account.currency.family) !== platformTransaction.family
      ) {
        return Promise.reject(
          new Error("Transaction family not matching account currency family"),
        );
      }

      return new Promise((resolve, reject) => {
        // @TODO replace with correct error
        if (!transaction) {
          tracking.platformSignTransactionFail(manifest);
          reject(new Error("Transaction required"));
          return;
        }

        const bridge = getAccountBridge(account, parentAccount);

        const { liveTx } = getPlatformTransactionSignFlowInfos(
          platformTransaction,
        );

        const t = bridge.createTransaction(account);
        const { recipient, ...txData } = liveTx;
        const t2 = bridge.updateTransaction(t, {
          recipient,
          subAccountId: isTokenAccount(account) ? account.id : undefined,
          feesStrategy: "custom",
        });

        const tx = bridge.updateTransaction(t2, {
          ...txData,
          userGasLimit: txData.gasLimit,
        });

        navigation.navigate(NavigatorName.SignTransaction, {
          screen: ScreenName.SignTransactionSummary,
          params: {
            currentNavigation: ScreenName.SignTransactionSummary,
            nextNavigation: ScreenName.SignTransactionSelectDevice,
            transaction: tx,
            accountId,
            parentId: parentAccount ? parentAccount.id : undefined,
            appName: params.useApp,
            onSuccess: ({ signedOperation, transactionSignError }) => {
              if (transactionSignError) {
                tracking.platformSignTransactionFail(manifest);
                reject(transactionSignError);
              } else {
                tracking.platformSignTransactionSuccess(manifest);
                resolve(serializePlatformSignedTransaction(signedOperation));
                const n = navigation.getParent() || navigation;
                n.pop();
              }
            },
            onError: error => {
              tracking.platformSignTransactionFail(manifest);
              reject(error);
            },
          },
        });
      });
    },
    [manifest, accounts, navigation],
  );

  const broadcastTransaction = useCallback(
    ({
      accountId,
      signedTransaction,
    }: {
      accountId: string,
      signedTransaction: RawPlatformSignedTransaction,
    }) => {
      const account = accounts.find(account => account.id === accountId);

      if (!account) {
        tracking.platformBroadcastFail(manifest);
        return Promise.reject(new Error("Account required"));
      }

      const parentAccount = isTokenAccount(account)
        ? accounts.find(a => a.id === account.parentId)
        : null;

      return new Promise((resolve, reject) => {
        // @TODO replace with correct error
        if (!signedTransaction) {
          tracking.platformBroadcastFail(manifest);
          reject(new Error("Transaction required"));
          return;
        }

        const signedOperation = deserializePlatformSignedTransaction(
          signedTransaction,
          accountId,
        );

        if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
          broadcastSignedTx(account, parentAccount, signedOperation).then(
            op => {
              tracking.platformBroadcastSuccess(manifest);
              resolve(op.hash);
            },
            error => {
              tracking.platformBroadcastFail(manifest);
              reject(error);
            },
          );
        }
      });
    },
    [manifest, accounts],
  );

  const startExchange = useCallback(
    ({ exchangeType }: { exchangeType: number }) => {
      tracking.platformStartExchangeRequested(manifest);

      return new Promise((resolve, reject) => {
        navigation.navigate(NavigatorName.PlatformExchange, {
          screen: ScreenName.PlatformStartExchange,
          params: {
            request: {
              exchangeType,
            },
            onResult: (result: {
              startExchangeResult?: number,
              startExchangeError?: Error,
              device: Device,
            }) => {
              if (result.startExchangeError) {
                tracking.platformStartExchangeFail(manifest);
                reject(result.startExchangeError);
              }

              if (result.startExchangeResult) {
                tracking.platformStartExchangeSuccess(manifest);
                setDevice(result.device);
                resolve(result.startExchangeResult);
              }

              const n = navigation.getParent() || navigation;
              n.pop();
            },
          },
        });
      });
    },
    [manifest, navigation],
  );

  const completeExchange = useCallback(
    ({
      provider,
      fromAccountId,
      toAccountId,
      transaction,
      binaryPayload,
      signature,
      feesStrategy,
      exchangeType,
    }: {
      provider: string,
      fromAccountId: string,
      toAccountId: string,
      transaction: RawPlatformTransaction,
      binaryPayload: string,
      signature: string,
      feesStrategy: string,
      exchangeType: number,
    }) => {
      // Nb get a hold of the actual accounts, and parent accounts
      const fromAccount = accounts.find(a => a.id === fromAccountId);
      let fromParentAccount;

      const toAccount = accounts.find(a => a.id === toAccountId);
      let toParentAccount;

      if (!fromAccount) {
        return null;
      }

      if (exchangeType === 0x00 && !toAccount) {
        // if we do a swap, a destination account must be provided
        return null;
      }

      if (fromAccount.type === "TokenAccount") {
        fromParentAccount = accounts.find(a => a.id === fromAccount.parentId);
      }
      if (toAccount && toAccount.type === "TokenAccount") {
        toParentAccount = accounts.find(a => a.id === toAccount.parentId);
      }

      const accountBridge = getAccountBridge(fromAccount, fromParentAccount);
      const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);

      // eslint-disable-next-line no-param-reassign
      transaction.family = mainFromAccount.currency.family;

      const platformTransaction = deserializePlatformTransaction(transaction);

      platformTransaction.feesStrategy = feesStrategy;

      let processedTransaction = accountBridge.createTransaction(
        mainFromAccount,
      );
      processedTransaction = accountBridge.updateTransaction(
        processedTransaction,
        platformTransaction,
      );

      tracking.platformCompleteExchangeRequested(manifest);
      return new Promise((resolve, reject) => {
        navigation.navigate(NavigatorName.PlatformExchange, {
          screen: ScreenName.PlatformCompleteExchange,
          params: {
            request: {
              exchangeType,
              provider,
              exchange: {
                fromAccount,
                fromParentAccount,
                toAccount,
                toParentAccount,
              },
              transaction: processedTransaction,
              binaryPayload,
              signature,
              feesStrategy,
            },
            device,
            onResult: (result: { operation?: any, error?: Error }) => {
              if (result.error) {
                tracking.platformStartExchangeFail(manifest);
                reject(result.error);
              }

              if (result.operation) {
                tracking.platformStartExchangeSuccess(manifest);
                resolve(result.operation);
              }

              setDevice();
              const n = navigation.getParent() || navigation;
              n.pop();
            },
          },
        });
      });
    },
    [accounts, manifest, navigation, device],
  );

  const handlers = useMemo(
    () => ({
      "account.list": listAccounts,
      "currency.list": listPlatformCurrencies,
      "account.request": requestAccount,
      "account.receive": receiveOnAccount,
      "transaction.sign": signTransaction,
      "transaction.broadcast": broadcastTransaction,
      "exchange.start": startExchange,
      "exchange.complete": completeExchange,
    }),
    [
      listAccounts,
      listPlatformCurrencies,
      requestAccount,
      receiveOnAccount,
      signTransaction,
      broadcastTransaction,
      startExchange,
      completeExchange,
    ],
  );

  const handleSend = useCallback(
    (request: JSONRPCRequest) => {
      targetRef?.current?.postMessage(
        JSON.stringify(request),
        typeof manifest.url === "string"
          ? manifest.url
          : manifest.url?.origin ?? "",
      );
    },
    [manifest],
  );

  const [receive] = useJSONRPCServer(handlers, handleSend);

  const handleMessage = useCallback(
    e => {
      // FIXME: event isn't the same on desktop & mobile
      // if (e.isTrusted && e.origin === manifest.url.origin && e.data) {
      if (e.nativeEvent?.data) {
        receive(JSON.parse(e.nativeEvent.data));
      }
    },
    [receive],
  );

  const handleLoad = useCallback(() => {
    if (!widgetLoaded) {
      tracking.platformLoadSuccess(manifest);
      setWidgetLoaded(true);
    }
  }, [manifest, widgetLoaded]);

  const handleReload = useCallback(() => {
    tracking.platformReload(manifest);
    setLoadDate(Date.now());
    setWidgetLoaded(false);
  }, [manifest]);

  const handleError = useCallback(() => {
    tracking.platformLoadFail(manifest);
  }, [manifest]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <ReloadButton onReload={handleReload} loading={!widgetLoaded} />
          <InfoPanelButton
            onReload={handleReload}
            loading={!widgetLoaded}
            isInfoPanelOpened={isInfoPanelOpened}
            setIsInfoPanelOpened={setIsInfoPanelOpened}
          />
        </View>
      ),
    });
  }, [navigation, widgetLoaded, handleReload, isInfoPanelOpened]);

  useEffect(() => {
    tracking.platformLoad(manifest);
  }, [manifest]);

  return (
    <SafeAreaView style={[styles.root]}>
      <InfoPanel
        name={manifest.name}
        icon={manifest.icon}
        url={manifest.homepageUrl}
        description={manifest.content.description}
        isOpened={isInfoPanelOpened}
        setIsOpened={setIsInfoPanelOpened}
      />
      <WebView
        ref={targetRef}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
        originWhitelist={manifest.domains}
        allowsInlineMediaPlayback
        source={{
          uri: uri.toString(),
        }}
        onLoad={handleLoad}
        onMessage={handleMessage}
        onError={handleError}
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFitmediaPlaybackRequiresUserAction
        automaticallyAdjustContentInsets={false}
        scrollEnabled={true}
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRight: {
    display: "flex",
    flexDirection: "row",
    paddingRight: 8,
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
  buttons: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});

export default WebPlatformPlayer;
