import {
  handlers as exchangeHandlers,
  ExchangeType,
} from "@ledgerhq/live-common/wallet-api/Exchange/server";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { AccountLike, Operation, Account, TokenAccount } from "@ledgerhq/types-live";
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { reduce, firstValueFrom } from "rxjs";
import BigNumber from "bignumber.js";
import { closePlatformAppDrawer, openExchangeDrawer } from "~/renderer/actions/UI";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { track } from "~/renderer/analytics/segment";
import { context } from "~/renderer/drawers/Provider";
import WebviewErrorDrawer from "~/renderer/screens/exchange/Swap2/Form/WebviewErrorDrawer";
import { WebviewProps } from "../Web3AppWebview/types";
import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import { getMainAccount, getParentAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/exchange/swap/hooks/useFromState";
import {
  convertToAtomicUnit,
  convertToNonAtomicUnit,
  getCustomFeesPerFamily,
} from "@ledgerhq/live-common/exchange/swap/webApp/utils";
import {
  getAccountIdFromWalletAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import {
  transformToBigNumbers,
  useGetSwapTrackingProperties,
} from "~/renderer/screens/exchange/Swap2/utils/index";
import FeesDrawerLiveApp from "~/renderer/screens/exchange/Swap2/Form/FeesDrawerLiveApp";
import logger from "~/renderer/logger";

const getSegWitAbandonSeedAddress = (): string => "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs";

export function usePTXCustomHandlers(
  manifest: WebviewProps["manifest"],
  accounts: AccountLike[],
): Record<string, any> {
  const dispatch = useDispatch();
  const { setDrawer } = React.useContext(context);
  const { t } = useTranslation();
  const swapDefaultTrack = useGetSwapTrackingProperties();
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

  return useMemo(() => {
    return {
      ...exchangeHandlers({
        accounts,
        tracking,
        manifest,
        uiHooks: {
          "custom.exchange.start": ({ exchangeParams, onSuccess, onCancel }) => {
            dispatch(
              openExchangeDrawer({
                type: "EXCHANGE_START",
                ...exchangeParams,
                exchangeType: ExchangeType[exchangeParams.exchangeType],
                onResult: result => {
                  onSuccess(result.nonce, result.device);
                },
                onCancel: cancelResult => {
                  onCancel(cancelResult.error, cancelResult.device);
                },
              }),
            );
          },
          "custom.exchange.complete": ({ exchangeParams, onSuccess, onCancel }) => {
            dispatch(
              openExchangeDrawer({
                type: "EXCHANGE_COMPLETE",
                ...exchangeParams,
                onResult: (operation: Operation) => {
                  onSuccess(operation.hash);
                },
                onCancel: (error: Error) => {
                  console.error(error);
                  onCancel(error);
                },
              }),
            );
          },
          "custom.exchange.error": ({ error }) => {
            dispatch(closePlatformAppDrawer());
            setDrawer(WebviewErrorDrawer, error);
            return Promise.resolve();
          },
          "custom.isReady": async () => {
            console.info("Earn Live App Loaded");
          },
          "custom.exchange.swap": ({ exchangeParams, onSuccess, onCancel }) => {
            dispatch(
              openExchangeDrawer({
                type: "EXCHANGE_COMPLETE",
                ...exchangeParams,
                onResult: operation => {
                  if (operation && exchangeParams.swapId) {
                    // return success to swap live app
                    onSuccess({
                      operationHash: operation.hash,
                      swapId: exchangeParams.swapId,
                    });
                  }
                },
                onCancel: (error: Error) => {
                  console.error(error);
                  onCancel(error);
                },
              }),
            );
          },
        },
      }),
      "custom.getFee": async ({
        params,
      }: {
        params: {
          fromAccountId: string;
          fromAmount: string;
          feeStrategy: string;
          openDrawer: boolean;
          customFeeConfig: object;
          SWAP_VERSION: string;
          gasLimit?: string;
        };
      }): Promise<{
        feesStrategy: string;
        estimatedFees: BigNumber | undefined;
        errors: object;
        warnings: object;
        customFeeConfig: object;
        gasLimit?: string;
        hasDrawer: boolean;
      }> => {
        const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
        if (!realFromAccountId) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }

        const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
        if (!fromAccount) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }
        const fromParentAccount = getParentAccount(fromAccount, accounts);

        let mainAccount = getMainAccount(fromAccount, fromParentAccount);
        const bridge = getAccountBridge(fromAccount, fromParentAccount);

        const subAccountId = fromAccount.type !== "Account" && fromAccount.id;

        // NOTE: we might sync all types of accounts here
        if (mainAccount.currency.id === "bitcoin") {
          try {
            const syncedAccount = await firstValueFrom(
              bridge
                .sync(mainAccount, { paginationConfig: {} })
                .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), mainAccount)),
            );
            if (syncedAccount) {
              mainAccount = syncedAccount;
            }
          } catch (e) {
            logger.error(e);
          }
        }

        const transaction = bridge.createTransaction(mainAccount);

        const preparedTransaction = await bridge.prepareTransaction(mainAccount, {
          ...transaction,
          subAccountId,
          recipient:
            mainAccount.currency.id === "bitcoin"
              ? getSegWitAbandonSeedAddress()
              : getAbandonSeedAddress(mainAccount.currency.id),
          amount: convertToAtomicUnit({
            amount: new BigNumber(params.fromAmount),
            account: fromAccount,
          }),
          feesStrategy: params.feeStrategy || "medium",
          customGasLimit: params.gasLimit ? new BigNumber(params.gasLimit) : null,
          ...transformToBigNumbers(params.customFeeConfig),
        });
        let status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
        const statusInit = status;
        let finalTx = preparedTransaction;
        let customFeeConfig = transaction && getCustomFeesPerFamily(finalTx);
        const setTransaction = async (newTransaction: any): Promise<any> => {
          status = await bridge.getTransactionStatus(mainAccount, newTransaction);
          customFeeConfig = transaction && getCustomFeesPerFamily(newTransaction);
          finalTx = newTransaction;
          return newTransaction;
        };

        const hasDrawer =
          ["evm", "bitcoin"].includes(transaction.family) &&
          !["optimism", "arbitrum", "base"].includes(mainAccount.currency.id);
        if (!params.openDrawer) {
          return {
            feesStrategy: finalTx.feesStrategy,
            estimatedFees: convertToNonAtomicUnit({
              amount: status.estimatedFees,
              account: mainAccount,
            }),
            errors: status.errors,
            warnings: status.warnings,
            customFeeConfig,
            hasDrawer,
            gasLimit: finalTx.gasLimit,
          };
        }

        return new Promise(resolve => {
          const performClose = (save: boolean) => {
            track("button_clicked2", {
              button: save ? "continueNetworkFees" : "closeNetworkFees",
              page: "quoteSwap",
              ...swapDefaultTrack,
              swapVersion: params.SWAP_VERSION,
              value: finalTx.feesStrategy || "custom",
            });
            setDrawer(undefined);
            if (!save) {
              resolve({
                feesStrategy: params.feeStrategy,
                estimatedFees: convertToNonAtomicUnit({
                  amount: statusInit.estimatedFees,
                  account: mainAccount,
                }),
                errors: statusInit.errors,
                warnings: statusInit.warnings,
                customFeeConfig: params.customFeeConfig,
                hasDrawer,
                gasLimit: finalTx.gasLimit,
              });
            }
            resolve({
              // little hack to make sure we do not return null (for bitcoin for instance)
              feesStrategy: finalTx.feesStrategy || "custom",
              estimatedFees: convertToNonAtomicUnit({
                amount: status.estimatedFees,
                account: mainAccount,
              }),
              errors: status.errors,
              warnings: status.warnings,
              customFeeConfig,
              hasDrawer,
              gasLimit: finalTx.gasLimit,
            });
          };

          setDrawer(
            FeesDrawerLiveApp,
            {
              setTransaction,
              account: fromAccount,
              parentAccount: fromParentAccount,
              status: status,
              provider: undefined,
              disableSlowStrategy: true,
              transaction: preparedTransaction,
              onRequestClose: (save: boolean) => performClose(save),
            },
            {
              title: t("swap2.form.details.label.fees"),
              forceDisableFocusTrap: true,
              onRequestClose: () => performClose(false),
            },
          );
        });
      },
      "custom.getTransactionByHash": async ({
        params,
      }: {
        params: {
          transactionHash: string;
          fromAccountId: string;
          SWAP_VERSION: string;
        };
      }): Promise<
        | {
            hash: string;
            blockHeight: number | undefined;
            blockHash: string | undefined;
            nonce: number;
            gasUsed: string;
            gasPrice: string;
            value: string;
          }
        | {}
      > => {
        const realFromAccountId = getAccountIdFromWalletAccountId(params.fromAccountId);
        if (!realFromAccountId) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }

        const fromAccount = accounts.find(acc => acc.id === realFromAccountId);
        if (!fromAccount) {
          return Promise.reject(new Error(`accountId ${params.fromAccountId} unknown`));
        }

        const fromParentAccount = getParentAccount(fromAccount, accounts);
        const mainAccount = getMainAccount(fromAccount, fromParentAccount);

        const nodeAPI = getNodeApi(mainAccount.currency);

        try {
          const tx = await nodeAPI.getTransaction(mainAccount.currency, params.transactionHash);
          return Promise.resolve(tx);
        } catch (error) {
          // not a real error, the node just didn't find the transaction yet
          return Promise.resolve({});
        }
      },
    };
  }, [accounts, tracking, manifest, dispatch, setDrawer, t, swapDefaultTrack]);
}
