import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { RpcError, Transport } from "@ledgerhq/wallet-api-core";
import { WalletAPIServer, firstValueFrom } from "@ledgerhq/wallet-api-server";
import { ACCOUNT_NOT_FOUND } from "@ledgerhq/wallet-api-server/lib/errors";
import { WebView as RNWebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-common/env";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import type { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import {
  broadcastTransactionLogic,
  receiveOnAccountLogic,
  signTransactionLogic,
  signMessageLogic,
} from "@ledgerhq/live-common/wallet-api/logic";
import { serializeWalletAPISignedTransaction } from "@ledgerhq/live-common/wallet-api/serializers";
import {
  useWalletAPIAccounts,
  useWalletAPICurrencies,
  useWalletAPIUrl,
} from "@ledgerhq/live-common/wallet-api/react";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/tracking";
import { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import { useTheme } from "styled-components/native";
import BigNumber from "bignumber.js";
import { NavigatorName, ScreenName } from "../../const";
import { broadcastSignedTx } from "../../logic/screenTransactionHooks";
import { accountsSelector } from "../../reducers/accounts";
import UpdateIcon from "../../icons/Update";
import InfoIcon from "../../icons/Info";
import InfoPanel from "./InfoPanel";
import { track } from "../../analytics/segment";
import prepareSignTransaction from "./liveSDKLogic";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
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
  const onPress = useCallback(
    () => !loading && onReload(),
    [loading, onReload],
  );

  return (
    <TouchableOpacity
      style={styles.buttons}
      disabled={loading}
      onPress={onPress}
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

  const onPress = useCallback(() => {
    setIsInfoPanelOpened(true);
  }, [setIsInfoPanelOpened]);

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
  const accounts = flattenAccounts(useSelector(accountsSelector));
  const navigation = useNavigation();
  const [loadDate, setLoadDate] = useState(new Date());
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [isInfoPanelOpened, setIsInfoPanelOpened] = useState(false);
  const uri = useWalletAPIUrl(
    manifest,
    {
      loadDate,
    },
    inputs,
  );
  const walletAPIAccounts = useWalletAPIAccounts(accounts);
  const currencies = useWalletAPICurrencies();

  // const requestAccount = useCallback(
  //   ({
  //     currencies: currencyIds,
  //     allowAddAccount = true,
  //     includeTokens,
  //   }: // TODO: use type RequestAccountParams from LedgerLiveApiSdk
  //   // }: RequestAccountParams) =>
  //   {
  //     currencies?: string[];
  //     allowAddAccount?: boolean;
  //     includeTokens?: boolean;
  //   }): Promise<RawWalletAPIAccount> =>
  //     new Promise((resolve, reject) => {
  //       tracking.requestAccountRequested(manifest);

  //       const allCurrencies = listAndFilterCurrencies({
  //         currencies: currencyIds,
  //         includeTokens,
  //       });
  //       // handle no curencies selected case
  //       const cryptoCurrencyIds =
  //         currencyIds && currencyIds.length > 0
  //           ? currencyIds
  //           : allCurrencies.map(({ id }) => id);

  //       const foundAccounts = cryptoCurrencyIds?.length
  //         ? accounts.filter(a =>
  //             cryptoCurrencyIds.includes(
  //               isTokenAccount(a) ? a.token.id : a.currency.id,
  //             ),
  //           )
  //         : accounts;

  //       // @TODO replace with correct error
  //       if (foundAccounts.length <= 0 && !allowAddAccount) {
  //         tracking.requestAccountFail(manifest);
  //         reject(new Error("No accounts found matching request"));
  //         return;
  //       }

  //       // list of queried cryptoCurrencies with one or more accounts -> used in case of not allowAddAccount and multiple accounts selectable
  //       const currenciesDiff = allowAddAccount
  //         ? cryptoCurrencyIds
  //         : foundAccounts
  //             .map(a => (isTokenAccount(a) ? a.token.id : a.currency.id))
  //             .filter(
  //               (c, i, arr) =>
  //                 cryptoCurrencyIds.includes(c) && i === arr.indexOf(c),
  //             );

  //       const onSuccess = (account: AccountLike, parentAccount: Account) => {
  //         tracking.requestAccountSuccess(manifest);
  //         resolve(
  //           serializeWalletAPIAccount(
  //             accountToWalletAPIAccount(account, parentAccount),
  //           ),
  //         );
  //       };

  //       const onError = (error: Error) => {
  //         tracking.requestAccountFail(manifest);
  //         reject(error);
  //       };

  //       // if single currency available redirect to select account directly
  //       if (currenciesDiff.length === 1) {
  //         const currency = findCryptoCurrencyById(currenciesDiff[0]);

  //         if (!currency) {
  //           tracking.requestAccountFail(manifest);
  //           // @TODO replace with correct error
  //           reject(new Error("Currency not found"));
  //           return;
  //         }

  //         navigation.navigate(NavigatorName.RequestAccount, {
  //           screen: ScreenName.RequestAccountsSelectAccount,
  //           params: {
  //             currencies: allCurrencies,
  //             currency,
  //             allowAddAccount,
  //             includeTokens,
  //             onSuccess,
  //             onError,
  //           },
  //         });
  //       } else {
  //         navigation.navigate(NavigatorName.RequestAccount, {
  //           screen: ScreenName.RequestAccountsSelectCrypto,
  //           params: {
  //             currencies: allCurrencies,
  //             allowAddAccount,
  //             includeTokens,
  //             onSuccess,
  //             onError,
  //           },
  //         });
  //       }
  //     }),
  //   [manifest, accounts, navigation],
  // );

  const serverRef = useRef<WalletAPIServer>();
  const transportRef = useRef<Transport>();

  useEffect(() => {
    if (targetRef.current) {
      transportRef.current = {
        onMessage: () => {
          // empty fn will be replaced by the server
        },
        send: message => {
          targetRef.current?.postMessage(message);
        },
      };
      serverRef.current = new WalletAPIServer(transportRef.current);
      serverRef.current.setAccounts(walletAPIAccounts);
      serverRef.current.setCurrencies(currencies);

      serverRef.current.setHandler(
        "account.request",
        async ({ accounts$, currencies$ }) => {
          const accounts = await firstValueFrom(accounts$);
          const currencies = await firstValueFrom(currencies$);
          console.log(accounts, currencies);
          if (!accounts[0]) {
            throw new RpcError(ACCOUNT_NOT_FOUND);
          }
          return accounts[0];
        },
      );

      serverRef.current.setHandler("account.receive", ({ account }) => {
        return receiveOnAccountLogic(
          { manifest, accounts, tracking },
          account.id,
          (
            account: AccountLike,
            parentAccount: Account | null,
            accountAddress: string,
          ) =>
            new Promise((resolve, reject) => {
              navigation.navigate(ScreenName.VerifyAccount, {
                account,
                parentId: parentAccount ? parentAccount.id : undefined,
                onSuccess: (_account: AccountLike) => {
                  tracking.receiveSuccess(manifest);
                  resolve(accountAddress);
                },
                onClose: () => {
                  tracking.receiveFail(manifest);
                  reject(new Error("User cancelled"));
                },
                onError: (error: Error) => {
                  tracking.receiveFail(manifest);
                  // @TODO put in correct error text maybe
                  reject(error);
                },
              });
            }),
        );
      });

      serverRef.current.setHandler("message.sign", ({ account, message }) => {
        return signMessageLogic(
          { manifest, accounts, tracking },
          account.id,
          message.toString("hex"),
          (
            { id: accountId }: AccountLike,
            message: MessageData | TypedMessageData,
          ) =>
            new Promise((resolve, reject) => {
              navigation.navigate(NavigatorName.SignMessage, {
                screen: ScreenName.SignSummary,
                params: {
                  message,
                  accountId,
                  onConfirmationHandler: (message: string) => {
                    tracking.signMessageSuccess(manifest);
                    resolve(Buffer.from(message));
                  },
                  onFailHandler: (error: Error) => {
                    tracking.signMessageFail(manifest);
                    reject(error);
                  },
                },
                onClose: () => {
                  tracking.signMessageUserRefused(manifest);
                  reject(UserRefusedOnDevice());
                },
              });
            }),
        );
      });

      serverRef.current.setHandler(
        "transaction.sign",
        ({ account, transaction, options }) => {
          return signTransactionLogic(
            { manifest, accounts, tracking },
            account.id,
            transaction,
            (
              account: AccountLike,
              parentAccount: Account | null,
              {
                liveTx,
              }: {
                liveTx: Partial<Transaction>;
              },
            ) => {
              const tx = prepareSignTransaction(
                account,
                parentAccount,
                liveTx as Partial<Transaction & { gasLimit: BigNumber }>,
              );

              return new Promise((resolve, reject) => {
                navigation.navigate(NavigatorName.SignTransaction, {
                  screen: ScreenName.SignTransactionSummary,
                  params: {
                    currentNavigation: ScreenName.SignTransactionSummary,
                    nextNavigation: ScreenName.SignTransactionSelectDevice,
                    transaction: tx as Transaction,
                    accountId: account.id,
                    parentId: parentAccount ? parentAccount.id : undefined,
                    appName: options?.hwAppId,
                    onSuccess: ({
                      signedOperation,
                      transactionSignError,
                    }: {
                      signedOperation: SignedOperation;
                      transactionSignError: Error;
                    }) => {
                      if (transactionSignError) {
                        tracking.signTransactionFail(manifest);
                        reject(transactionSignError);
                      } else {
                        tracking.signTransactionSuccess(manifest);
                        resolve(
                          serializeWalletAPISignedTransaction(signedOperation),
                        );
                        const n =
                          navigation.getParent<
                            StackNavigatorNavigation<BaseNavigatorStackParamList>
                          >() || navigation;
                        n.pop();
                      }
                    },
                    onError: (error: Error) => {
                      tracking.signTransactionFail(manifest);
                      reject(error);
                    },
                  },
                });
              });
            },
          );
        },
      );

      serverRef.current.setHandler(
        "transaction.signAndBroadcast",
        async ({ account, transaction, options }) => {
          // TODO avoid duplicated signTransactionLogic & UI code
          const signedTransaction = await signTransactionLogic(
            { manifest, accounts, tracking },
            account.id,
            transaction,
            (
              account: AccountLike,
              parentAccount: Account | null,
              {
                liveTx,
              }: {
                liveTx: Partial<Transaction>;
              },
            ) => {
              const tx = prepareSignTransaction(
                account,
                parentAccount,
                liveTx as Partial<Transaction & { gasLimit: BigNumber }>,
              );

              return new Promise((resolve, reject) => {
                navigation.navigate(NavigatorName.SignTransaction, {
                  screen: ScreenName.SignTransactionSummary,
                  params: {
                    currentNavigation: ScreenName.SignTransactionSummary,
                    nextNavigation: ScreenName.SignTransactionSelectDevice,
                    transaction: tx as Transaction,
                    accountId: account.id,
                    parentId: parentAccount ? parentAccount.id : undefined,
                    appName: options?.hwAppId,
                    onSuccess: ({
                      signedOperation,
                      transactionSignError,
                    }: {
                      signedOperation: SignedOperation;
                      transactionSignError: Error;
                    }) => {
                      if (transactionSignError) {
                        tracking.signTransactionFail(manifest);
                        reject(transactionSignError);
                      } else {
                        tracking.signTransactionSuccess(manifest);
                        resolve(
                          serializeWalletAPISignedTransaction(signedOperation),
                        );
                        const n =
                          navigation.getParent<
                            StackNavigatorNavigation<BaseNavigatorStackParamList>
                          >() || navigation;
                        n.pop();
                      }
                    },
                    onError: (error: Error) => {
                      tracking.signTransactionFail(manifest);
                      reject(error);
                    },
                  },
                });
              });
            },
          );

          return broadcastTransactionLogic(
            { manifest, accounts, tracking },
            account.id,
            signedTransaction,
            async (account, parentAccount, signedOperation) =>
              new Promise((resolve, reject) => {
                if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
                  broadcastSignedTx(
                    account,
                    parentAccount,
                    signedOperation,
                  ).then(
                    op => {
                      tracking.broadcastSuccess(manifest);
                      resolve(op.hash);
                    },
                    error => {
                      tracking.broadcastFail(manifest);
                      reject(error);
                    },
                  );
                }
              }),
          );
        },
      );
    }
    // Only used to init the server, no update needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    serverRef.current?.setAccounts(walletAPIAccounts);
  }, [walletAPIAccounts]);

  useEffect(() => {
    serverRef.current?.setCurrencies(currencies);
  }, [currencies]);

  const handleMessage = useCallback(e => {
    if (e.nativeEvent?.data) {
      transportRef.current?.onMessage?.(e.nativeEvent.data);
    }
  }, []);

  const handleLoad = useCallback(() => {
    if (!widgetLoaded) {
      tracking.loadSuccess(manifest);
      setWidgetLoaded(true);
    }
  }, [manifest, widgetLoaded]);

  const handleReload = useCallback(() => {
    tracking.reload(manifest);
    setLoadDate(new Date());
    setWidgetLoaded(false);
  }, [manifest]);

  const handleError = useCallback(() => {
    tracking.loadFail(manifest);
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
    tracking.load(manifest);
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
