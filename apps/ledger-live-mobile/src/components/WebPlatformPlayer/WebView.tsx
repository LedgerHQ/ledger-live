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
import { WebView as RNWebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { JSONRPCRequest } from "json-rpc-2.0";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import {
  Account,
  AccountLike,
  Operation,
  SignedOperation,
} from "@ledgerhq/types-live";
import type {
  RawPlatformTransaction,
  RawPlatformSignedTransaction,
  RawPlatformAccount,
} from "@ledgerhq/live-common/platform/rawTypes";
import { getEnv } from "@ledgerhq/live-common/env";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  findCryptoCurrencyById,
  listAndFilterCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AppManifest } from "@ledgerhq/live-common/platform/types";
import {
  broadcastTransactionLogic,
  receiveOnAccountLogic,
  signTransactionLogic,
  completeExchangeLogic,
  signMessageLogic,
} from "@ledgerhq/live-common/platform/logic";
import { useJSONRPCServer } from "@ledgerhq/live-common/platform/JSONRPCServer";
import { accountToPlatformAccount } from "@ledgerhq/live-common/platform/converters";
import {
  serializePlatformAccount,
  serializePlatformSignedTransaction,
} from "@ledgerhq/live-common/platform/serializers";
import {
  useListPlatformAccounts,
  useListPlatformCurrencies,
  usePlatformUrl,
} from "@ledgerhq/live-common/platform/react";
import trackingWrapper from "@ledgerhq/live-common/platform/tracking";
import { useTheme } from "styled-components/native";
import BigNumber from "bignumber.js";
import { NavigatorName, ScreenName } from "../../const";
import { broadcastSignedTx } from "../../logic/screenTransactionHooks";
import { flattenAccountsSelector } from "../../reducers/accounts";
import UpdateIcon from "../../icons/Update";
import InfoIcon from "../../icons/Info";
import InfoPanel from "./InfoPanel";
import { track } from "../../analytics/segment";
import prepareSignTransaction from "./liveSDKLogic";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";

const tracking = trackingWrapper(track);

type Props = {
  manifest: AppManifest;
  inputs?: Record<string, string>;
};

const ReloadButton = ({
  onReload,
  loading,
}: {
  onReload: () => void;
  loading: boolean;
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.buttons}
      disabled={loading}
      onPress={() => !loading && onReload()}
    >
      <UpdateIcon size={18} color={colors.neutral.c70} />
    </TouchableOpacity>
  );
};

const InfoPanelButton = ({
  loading,
  setIsInfoPanelOpened,
}: {
  loading: boolean;
  setIsInfoPanelOpened: (_: boolean) => void;
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
      <InfoIcon size={18} color={colors.neutral.c70} />
    </TouchableOpacity>
  );
};

export const WebView = ({ manifest, inputs }: Props) => {
  const targetRef: {
    current: null | RNWebView;
  } = useRef(null);
  const accounts = useSelector(flattenAccountsSelector);
  const navigation =
    useNavigation<
      RootNavigationComposite<
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >
    >();
  const [loadDate, setLoadDate] = useState(new Date());
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);
  const [device, setDevice] = useState<Device>();
  const uri = usePlatformUrl(
    manifest,
    {
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
      currencies?: string[];
      allowAddAccount?: boolean;
      includeTokens?: boolean;
    }): Promise<RawPlatformAccount> =>
      new Promise((resolve, reject) => {
        tracking.platformRequestAccountRequested(manifest);

        /**
         * make sure currencies are strings
         * PS: yes `currencies` is properly typed as `string[]` but this typing only
         * works at build time and the `currencies` array is received at runtime from
         * JSONRPC requests. So we need to make sure the array is properly typed.
         */
        const safeCurrencyIds =
          currencyIds?.filter(c => typeof c === "string") ?? undefined;

        const allCurrencies = listAndFilterCurrencies({
          currencies: safeCurrencyIds,
          includeTokens,
        });
        // handle no curencies selected case
        const cryptoCurrencyIds =
          safeCurrencyIds && safeCurrencyIds.length > 0
            ? safeCurrencyIds
            : allCurrencies.map(currency => currency.id);

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

        const onSuccess = (account: AccountLike, parentAccount?: Account) => {
          tracking.platformRequestAccountSuccess(manifest);
          resolve(
            serializePlatformAccount(
              accountToPlatformAccount(account, parentAccount),
            ),
          );
        };

        const onError = (error: Error) => {
          tracking.platformRequestAccountFail(manifest);
          reject(error);
        };

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
              onSuccess,
              onError,
            },
          });
        } else {
          navigation.navigate(NavigatorName.RequestAccount, {
            screen: ScreenName.RequestAccountsSelectCrypto,
            params: {
              currencies: allCurrencies,
              allowAddAccount,
              onSuccess,
              onError,
            },
          });
        }
      }),
    [manifest, accounts, navigation],
  );

  const receiveOnAccount = useCallback(
    ({ accountId }: { accountId: string }) =>
      receiveOnAccountLogic(
        { manifest, accounts, tracking },
        accountId,
        (account, parentAccount, accountAddress) =>
          new Promise((resolve, reject) => {
            navigation.navigate(ScreenName.VerifyAccount, {
              account,
              parentId: parentAccount ? parentAccount.id : undefined,
              onSuccess: (_account: AccountLike) => {
                tracking.platformReceiveSuccess(manifest);
                resolve(accountAddress);
              },
              onClose: () => {
                tracking.platformReceiveFail(manifest);
                reject(new Error("User cancelled"));
              },
              onError: (error: Error) => {
                tracking.platformReceiveFail(manifest);
                // @TODO put in correct error text maybe
                reject(error);
              },
            });
          }),
      ),
    [manifest, accounts, navigation],
  );

  const signTransaction = useCallback(
    ({
      accountId,
      transaction,
      params,
    }: // TODO: use type SignTransactionParams from LedgerLiveApiSdk
    // }: SignTransactionParams) => {
    {
      accountId: string;
      transaction: RawPlatformTransaction;
      params?: {
        /**
         * The name of the Ledger Nano app to use for the signing process
         */
        useApp: string;
      };
    }) =>
      signTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        transaction,
        (account, parentAccount, { liveTx }) => {
          const tx = prepareSignTransaction(
            account,
            parentAccount,
            liveTx as Partial<Transaction & { gasLimit: BigNumber }>,
          );

          return new Promise((resolve, reject) => {
            (
              navigation as StackNavigatorNavigation<BaseNavigatorStackParamList>
            ).navigate(NavigatorName.SignTransaction, {
              screen: ScreenName.SignTransactionSummary,
              params: {
                currentNavigation: ScreenName.SignTransactionSummary,
                nextNavigation: ScreenName.SignTransactionSelectDevice,
                transaction: tx as Transaction,
                accountId,
                parentId: parentAccount?.id,
                appName: params?.useApp,
                onSuccess: ({
                  signedOperation,
                  transactionSignError,
                }: {
                  signedOperation: SignedOperation;
                  transactionSignError: Error;
                }) => {
                  if (transactionSignError) {
                    tracking.platformSignTransactionFail(manifest);
                    reject(transactionSignError);
                  } else {
                    tracking.platformSignTransactionSuccess(manifest);
                    resolve(
                      serializePlatformSignedTransaction(signedOperation),
                    );
                    const n =
                      navigation.getParent<
                        StackNavigatorNavigation<BaseNavigatorStackParamList>
                      >() || navigation;
                    n.pop();
                  }
                },
                onError: (error: Error) => {
                  tracking.platformSignTransactionFail(manifest);
                  reject(error);
                },
              },
            });
          });
        },
      ),
    [manifest, accounts, navigation],
  );

  const broadcastTransaction = useCallback(
    ({
      accountId,
      signedTransaction,
    }: {
      accountId: string;
      signedTransaction: RawPlatformSignedTransaction;
    }) =>
      broadcastTransactionLogic(
        { manifest, accounts, tracking },
        accountId,
        signedTransaction,
        async (account, parentAccount, signedOperation) => {
          let optimisticOperation: Operation = signedOperation.operation;

          if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
            try {
              optimisticOperation = await broadcastSignedTx(
                account,
                parentAccount,
                signedOperation,
              );
              tracking.platformBroadcastSuccess(manifest);
            } catch (error) {
              tracking.platformBroadcastFail(manifest);
              throw error;
            }
          }

          return optimisticOperation.hash;
        },
      ),
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
              startExchangeResult?: string;
              startExchangeError?: Error;
              device?: Device;
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

              const n =
                navigation.getParent<
                  StackNavigatorNavigation<BaseNavigatorStackParamList>
                >() || navigation;
              n.pop();
            },
          },
        });
      });
    },
    [manifest, navigation],
  );

  const completeExchange = useCallback(
    (request: {
      provider: string;
      fromAccountId: string;
      toAccountId: string;
      transaction: RawPlatformTransaction;
      binaryPayload: string;
      signature: string;
      feesStrategy: string;
      exchangeType: number;
    }) =>
      completeExchangeLogic(
        { manifest, accounts, tracking },
        request,
        ({
          provider,
          exchange,
          transaction,
          binaryPayload,
          signature,
          feesStrategy,
          exchangeType,
        }): Promise<Operation> =>
          new Promise((resolve, reject) => {
            navigation.navigate(NavigatorName.PlatformExchange, {
              screen: ScreenName.PlatformCompleteExchange,
              params: {
                request: {
                  exchangeType,
                  provider,
                  exchange,
                  transaction: transaction as Transaction,
                  binaryPayload,
                  signature,
                  feesStrategy,
                },
                device,
                onResult: (result: {
                  operation?: Operation;
                  error?: Error;
                }) => {
                  if (result.error) {
                    tracking.platformStartExchangeFail(manifest);
                    reject(result.error);
                  }
                  if (result.operation) {
                    tracking.platformStartExchangeSuccess(manifest);
                    resolve(result.operation);
                  }
                  setDevice(undefined);
                  const n =
                    navigation.getParent<
                      StackNavigatorNavigation<BaseNavigatorStackParamList>
                    >() || navigation;
                  n.pop();
                },
              },
            });
          }),
      ),
    [accounts, manifest, navigation, device],
  );

  const signMessage = useCallback(
    ({ accountId, message }: { accountId: string; message: string }) =>
      signMessageLogic(
        { manifest, accounts, tracking },
        accountId,
        message,
        ({ id: accountId }, message) =>
          new Promise((resolve, reject) => {
            navigation.navigate(NavigatorName.SignMessage, {
              screen: ScreenName.SignSummary,
              params: {
                message,
                accountId,
                onConfirmationHandler: (message: string) => {
                  tracking.platformSignMessageSuccess(manifest);
                  resolve(message);
                },
                onFailHandler: (error: Error) => {
                  tracking.platformSignMessageFail(manifest);
                  reject(error);
                },
              },
              onClose: () => {
                tracking.platformSignMessageUserRefused(manifest);
                reject(UserRefusedOnDevice());
              },
            });
          }),
      ),
    [accounts, manifest, navigation],
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
      "message.sign": signMessage,
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
      signMessage,
    ],
  );
  const handleSend = useCallback((request: JSONRPCRequest): Promise<void> => {
    targetRef?.current?.postMessage(JSON.stringify(request));

    return Promise.resolve();
  }, []);
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
    setLoadDate(new Date());
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
            loading={!widgetLoaded}
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
        uri={uri.toString()}
        description={manifest.content.description}
        isOpened={isInfoPanelOpened}
        setIsOpened={setIsInfoPanelOpened}
      />
      <RNWebView
        ref={targetRef}
        startInLoadingState={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
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
        overScrollMode="content"
        bounces={false}
        mediaPlaybackRequiresUserAction={false}
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
