import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { context } from "~/renderer/drawers/Provider";
import WebviewErrorDrawer from "./WebviewErrorDrawer/index";
import {
  getAccountCurrency,
  getMainAccount,
  getParentAccount,
} from "@ledgerhq/live-common/account/helpers";
import { handlers as loggerHandlers } from "@ledgerhq/live-common/wallet-api/CustomLogger/server";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import { SubAccount } from "@ledgerhq/types-live";
import { SwapOperation } from "@ledgerhq/types-live/lib/swap";
import BigNumber from "bignumber.js";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewProps, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  enablePlatformDevToolsSelector,
  languageSelector,
} from "~/renderer/reducers/settings";
import { useRedirectToSwapHistory } from "../utils/index";

import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { usePTXCustomHandlers } from "~/renderer/components/WebPTXPlayer/CustomHandlers";
import { captureException } from "~/sentry/internal";
import FeesDrawerLiveApp from "./FeesDrawerLiveApp";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/exchange/swap/hooks/useFromState";
import { convertToAtomicUnit } from "@ledgerhq/live-common/exchange/swap/webApp/utils";

export class UnableToLoadSwapLiveError extends Error {
  constructor(message: string) {
    const name = "UnableToLoadSwapLiveError";
    super(message || name);
    this.name = name;
    this.message = message;
  }
}

export type SwapProps = {
  provider: string;
  fromAccountId: string;
  fromParentAccountId?: string;
  toAccountId: string;
  fromAmount: string;
  toAmount?: string;
  quoteId: string;
  rate: string;
  feeStrategy: string;
  customFeeConfig: string;
  cacheKey: string;
  loading: boolean;
  error: boolean;
  providerRedirectURL: string;
  toNewTokenId: string;
  swapApiBase: string;
  estimatedFees: string;
  estimatedFeesUnit: string;
  updateTransaction: any;
  setTransaction: any;
  status: TransactionStatus;
};

export type SwapWebProps = {
  manifest: LiveAppManifest;
  swapState?: Partial<SwapProps>;
  liveAppUnavailable(): void;
  sourceCurrencyId?: string;
  targetCurrencyId?: string;
  isMaxEnabled?: boolean;
};

export const SwapWebManifestIDs = {
  Demo0: "swap-live-app-demo-0",
  Demo1: "swap-live-app-demo-1",
};

const SwapWebAppWrapper = styled.div`
  width: 100%;
  flex: 1;
`;

const SwapWebView = ({
  manifest,
  swapState,
  liveAppUnavailable,
  sourceCurrencyId,
  targetCurrencyId,
  isMaxEnabled,
}: SwapWebProps) => {
  const {
    colors: {
      palette: { type: themeType },
    },
  } = useTheme();
  const dispatch = useDispatch();
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const { setDrawer } = React.useContext(context);
  // const accountsFL = useSelector(flattenAccountsSelector);
  const accounts = useSelector(shallowAccountsSelector);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(languageSelector);
  const redirectToHistory = useRedirectToSwapHistory();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);

  const hasSwapState = !!swapState;
  const customPTXHandlers = usePTXCustomHandlers(manifest);

  const { fromCurrency, addressFrom, addressTo } = useMemo(() => {
    const [, , fromCurrency, addressFrom] =
      getAccountIdFromWalletAccountId(swapState?.fromAccountId || "")?.split(":") || [];

    const [, , toCurrency, addressTo] =
      getAccountIdFromWalletAccountId(swapState?.toAccountId || "")?.split(":") || [];

    return {
      fromCurrency,
      addressFrom,
      toCurrency,
      addressTo,
    };
  }, [swapState?.fromAccountId, swapState?.toAccountId]);

  const customHandlers = useMemo(() => {
    return {
      ...loggerHandlers,
      ...customPTXHandlers,
      "custom.swapStateGet": () => {
        return Promise.resolve(swapState);
      },
      // TODO: when we need bidirectional communication
      // "custom.swapStateSet": (params: CustomHandlersParams<unknown>) => {
      //   return Promise.resolve();
      // },
      "custom.saveSwapToHistory": ({
        params,
      }: {
        params: { swap: SwapProps; transaction_id: string };
      }) => {
        const { swap, transaction_id } = params;
        if (!swap || !transaction_id || !swap.provider || !swap.fromAmount || !swap.toAmount) {
          return Promise.reject("Cannot save swap missing params");
        }
        const fromId = getAccountIdFromWalletAccountId(swap.fromAccountId);
        const toId = getAccountIdFromWalletAccountId(swap.toAccountId);
        if (!fromId || !toId) return Promise.reject("Accounts not found");
        const operationId = `${fromId}-${transaction_id}-OUT`;

        const swapOperation: SwapOperation = {
          status: "pending",
          provider: swap.provider,
          operationId,
          swapId: transaction_id,
          receiverAccountId: toId,
          tokenId: toId,
          fromAmount: new BigNumber(swap.fromAmount),
          toAmount: new BigNumber(swap.toAmount),
        };

        dispatch(
          updateAccountWithUpdater(fromId, account => {
            const fromCurrency = getAccountCurrency(account);
            const isFromToken = fromCurrency.type === "TokenCurrency";
            const subAccounts = account.type === "Account" && account.subAccounts;
            return isFromToken && subAccounts
              ? {
                  ...account,
                  subAccounts: subAccounts.map<SubAccount>((a: SubAccount) => {
                    const subAccount = {
                      ...a,
                      swapHistory: [...a.swapHistory, swapOperation],
                    };
                    return a.id === fromId ? subAccount : a;
                  }),
                }
              : { ...account, swapHistory: [...account.swapHistory, swapOperation] };
          }),
        );
        return Promise.resolve();
      },
      "custom.swapRedirectToHistory": () => {
        redirectToHistory();
      },
      // opens the drawer with the fees
      "custom.getFee": async ({
        params,
      }: {
        params: {
          fromAccountId: string;
          fromAmount: string;
          feeStrategy: string;
          openDrawer: boolean;
        };
      }) => {
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
        const bridge = getAccountBridge(fromAccount, fromParentAccount);
        const subAccountId = fromAccount.type !== "Account" && fromAccount.id;
        let transaction = bridge.createTransaction(mainAccount);
        const preparedTransaction = await bridge.prepareTransaction(mainAccount, {
          ...transaction,
          recipient: getAbandonSeedAddress(mainAccount.currency.id),
          amount: convertToAtomicUnit({
            amount: new BigNumber(params.fromAmount),
            account: mainAccount,
          }),
          feesStrategy: params.feeStrategy || "medium",
        });
        let status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
        let finalTx = preparedTransaction;
        const setTransaction = (newTransaction: Transaction): Promise<Transaction> => {
          return new Promise(async resolve => {
            console.log("Setting transaction:", newTransaction);
            const preparedTransaction = await bridge.prepareTransaction(
              mainAccount,
              newTransaction,
            );
            status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
            console.log(
              "%capps/ledger-live-desktop/src/renderer/screens/exchange/Swap2/Form/SwapWebView.tsx:239 status",
              "color: #007acc;",
              status,
            );
            finalTx = preparedTransaction;
            resolve(newTransaction);
          });
        };
        if (!params.openDrawer) {
          return Promise.resolve({
            feesStrategy: finalTx.feesStrategy,
            estimatedfees: status.estimatedFees,
            errors: status.errors,
            warnings: status.warnings,
          });
        }
        const drawerPromise = new Promise<{
          feesStrategy: BigNumber;
          estimatedfees: BigNumber;
          errors: any;
          warnings: any;
        }>(async resolve => {
          setDrawer(FeesDrawerLiveApp, {
            setTransaction,
            mainAccount: fromAccount,
            parentAccount: fromParentAccount,
            status: status,
            provider: undefined,
            disableSlowStrategy: true,
            transaction: preparedTransaction,
            onRequestClose: () => {
              console.log(
                "%capps/ledger-live-desktop/src/renderer/screens/exchange/Swap2/Form/SwapWebView.tsx:261 transaction",
                "color: #007acc;",
                finalTx,
              );
              console.log(
                "%capps/ledger-live-desktop/src/renderer/screens/exchange/Swap2/Form/SwapWebView.tsx:254 status",
                "color: #007acc;",
                status,
              );
              setDrawer(undefined);
              resolve({
                feesStrategy: finalTx.feesStrategy,
                estimatedfees: status.estimatedFees,
                errors: status.errors,
                warnings: status.warnings,
              });
            },
          });
        });

        return drawerPromise;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapState]);

  useEffect(() => {
    if (webviewState.url.includes("/unknown-error")) {
      // the live app has re-directed to /unknown-error. Handle this in callback, probably wallet-api failure.
      onSwapWebviewError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webviewState.url]);

  const hashString = useMemo(() => {
    const searchParams = new URLSearchParams();

    const swapParams = {
      addressFrom: addressFrom,
      addressTo: addressTo,
      amountFrom: swapState?.fromAmount,
      from: sourceCurrencyId,
      hasError: swapState?.error ? "true" : undefined, // append param only if error is true
      isMaxEnabled: isMaxEnabled,
      loading: swapState?.loading,
      networkFees: swapState?.estimatedFees,
      networkFeesCurrency: fromCurrency,
      provider: swapState?.provider,
      to: targetCurrencyId,
    };

    Object.entries(swapParams).forEach(([key, value]) => {
      if (value != null) {
        // Convert all values to string as URLSearchParams expects string values
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }, [
    swapState?.fromAmount,
    swapState?.loading,
    swapState?.estimatedFees,
    swapState?.provider,
    swapState?.error,
    addressFrom,
    addressTo,
    sourceCurrencyId,
    isMaxEnabled,
    fromCurrency,
    targetCurrencyId,
  ]);

  // return loader???
  if (!hasSwapState) {
    return null;
  }

  const onSwapWebviewError = (error?: SwapLiveError) => {
    console.error("onSwapWebviewError", error);
    setDrawer(WebviewErrorDrawer, error);
  };

  const onStateChange: WebviewProps["onStateChange"] = state => {
    setWebviewState(state);

    if (!state.loading && state.isAppUnavailable) {
      liveAppUnavailable();
      captureException(
        new UnableToLoadSwapLiveError(
          '"Failed to load swap live app using WebPlatformPlayer in SwapWeb",',
        ),
      );
    }
  };

  return (
    <>
      {enablePlatformDevTools && (
        <TopBar
          manifest={{ ...manifest, url: `${manifest.url}#${hashString}` }}
          webviewAPIRef={webviewAPIRef}
          webviewState={webviewState}
        />
      )}

      <SwapWebAppWrapper>
        <Web3AppWebview
          manifest={{ ...manifest, url: `${manifest.url}#${hashString}` }}
          inputs={{
            theme: themeType,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
          }}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          customHandlers={customHandlers as never}
          hideLoader
        />
      </SwapWebAppWrapper>
    </>
  );
};

export default SwapWebView;
