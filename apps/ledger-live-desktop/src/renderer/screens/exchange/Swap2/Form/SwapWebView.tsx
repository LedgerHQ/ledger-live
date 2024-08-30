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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewProps, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import { context } from "~/renderer/drawers/Provider";
import useTheme from "~/renderer/hooks/useTheme";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  enablePlatformDevToolsSelector,
  languageSelector,
} from "~/renderer/reducers/settings";
import {
  transformToBigNumbers,
  useGetSwapTrackingProperties,
  useRedirectToSwapHistory,
} from "../utils/index";
import WebviewErrorDrawer from "./WebviewErrorDrawer/index";

import { GasOptions } from "@ledgerhq/coin-evm/lib/types/transaction";
import { NetworkDown } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/exchange/swap/hooks/useFromState";
import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import {
  convertToAtomicUnit,
  convertToNonAtomicUnit,
  getCustomFeesPerFamily,
} from "@ledgerhq/live-common/exchange/swap/webApp/utils";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTranslation } from "react-i18next";
import { track } from "~/renderer/analytics/segment";
import { usePTXCustomHandlers } from "~/renderer/components/WebPTXPlayer/CustomHandlers";
import { NetworkStatus, useNetworkStatus } from "~/renderer/hooks/useNetworkStatus";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { captureException } from "~/sentry/renderer";
import { CustomSwapQuotesState } from "../hooks/useSwapLiveAppQuoteState";
import FeesDrawerLiveApp from "./FeesDrawerLiveApp";

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
};

export type SwapWebProps = {
  manifest: LiveAppManifest;
  liveAppUnavailable: () => void;
  setQuoteState?: (next: CustomSwapQuotesState) => void;
  swapState?: Partial<SwapProps>;
  isMaxEnabled?: boolean;
  sourceCurrency?: TokenCurrency | CryptoCurrency;
  targetCurrency?: TokenCurrency | CryptoCurrency;
};

export const SwapWebManifestIDs = {
  Demo0: "swap-live-app-demo-0",
  Demo1: "swap-live-app-demo-1",
  Demo3: "swap-live-app-demo-3",
};

const SwapWebAppWrapper = styled.div`
  width: 100%;
  flex: 1;
`;

const getSegWitAbandonSeedAddress = (): string => "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs";

const defaultContentSize: Record<string, number> = {};

const SwapWebView = ({
  manifest,
  swapState,
  liveAppUnavailable,
  isMaxEnabled,
  sourceCurrency,
  targetCurrency,
  setQuoteState,
}: SwapWebProps) => {
  const {
    colors: {
      palette: { type: themeType },
    },
  } = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const { setDrawer } = React.useContext(context);
  const accounts = useSelector(flattenAccountsSelector);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const discreetMode = useSelector(discreetModeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(languageSelector);
  const redirectToHistory = useRedirectToSwapHistory();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const { networkStatus } = useNetworkStatus();
  const isOffline = networkStatus === NetworkStatus.OFFLINE;
  const swapDefaultTrack = useGetSwapTrackingProperties();

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

  const [windowContentSize, setWindowContentSize] = useState(defaultContentSize);

  const customHandlers = useMemo(() => {
    return {
      ...loggerHandlers,
      ...customPTXHandlers,
      "custom.swapStateGet": () => {
        return Promise.resolve(swapState);
      },
      "custom.setContentSize": ({ params }: { params?: Record<string, number> }) => {
        if (params) {
          setWindowContentSize(params);
        }
        return Promise.resolve();
      },
      "custom.setQuote": (quote: {
        params?: {
          amountTo?: number;
          amountToCounterValue?: { value: number; fiat: string };
          code?: string;
          parameter: { minAmount: string; maxAmount: string };
        };
      }) => {
        const toUnit = targetCurrency?.units[0];
        const fromUnit = sourceCurrency?.units[0];

        if (!quote.params) {
          setQuoteState?.({
            amountTo: undefined,
            swapError: undefined,
            counterValue: undefined,
          });
          return Promise.resolve();
        }

        if (quote.params?.code && fromUnit) {
          switch (quote.params.code) {
            case "minAmountError":
              setQuoteState?.({
                amountTo: undefined,
                counterValue: undefined,
                swapError: new SwapExchangeRateAmountTooLow(undefined, {
                  minAmountFromFormatted: formatCurrencyUnit(
                    fromUnit,
                    new BigNumber(quote.params.parameter.minAmount).times(10 ** fromUnit.magnitude),
                    {
                      alwaysShowSign: false,
                      disableRounding: true,
                      showCode: true,
                    },
                  ),
                }),
              });
              return Promise.resolve();
            case "maxAmountError":
              setQuoteState?.({
                amountTo: undefined,
                counterValue: undefined,
                swapError: new SwapExchangeRateAmountTooLow(undefined, {
                  minAmountFromFormatted: formatCurrencyUnit(
                    fromUnit,
                    new BigNumber(quote.params.parameter.maxAmount).times(10 ** fromUnit.magnitude),
                    {
                      alwaysShowSign: false,
                      disableRounding: true,
                      showCode: true,
                    },
                  ),
                }),
              });
              return Promise.resolve();
          }
        }

        if (toUnit && quote?.params?.amountTo) {
          const amountTo = BigNumber(quote?.params?.amountTo).times(10 ** toUnit.magnitude);
          const counterValue = quote?.params?.amountToCounterValue?.value
            ? BigNumber(quote.params.amountToCounterValue.value).times(
                10 ** fiatCurrency.units[0].magnitude,
              )
            : undefined;

          setQuoteState?.({
            amountTo,
            counterValue: counterValue,
            swapError: undefined,
          });
        }

        return Promise.resolve();
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
        };
      }): Promise<{
        feesStrategy: string;
        estimatedFees: BigNumber | undefined;
        errors: object;
        warnings: object;
        customFeeConfig: object;
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

        const mainAccount = getMainAccount(fromAccount, fromParentAccount);
        const bridge = getAccountBridge(fromAccount, fromParentAccount);

        const subAccountId = fromAccount.type !== "Account" && fromAccount.id;
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
          ...transformToBigNumbers(params.customFeeConfig),
        });
        let status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
        const statusInit = status;
        let finalTx = preparedTransaction;
        let customFeeConfig = transaction && getCustomFeesPerFamily(finalTx);
        const setTransaction = async (newTransaction: Transaction): Promise<Transaction> => {
          const preparedTransaction = await bridge.prepareTransaction(mainAccount, newTransaction);
          status = await bridge.getTransactionStatus(mainAccount, preparedTransaction);
          customFeeConfig = transaction && getCustomFeesPerFamily(preparedTransaction);
          finalTx = preparedTransaction;
          return newTransaction;
        };

        if (!params.openDrawer) {
          // filters out the custom fee config for chains without drawer
          const config = ["evm", "bitcoin"].includes(transaction.family)
            ? { hasDrawer: true, ...customFeeConfig }
            : {};
          return {
            feesStrategy: finalTx.feesStrategy,
            estimatedFees: convertToNonAtomicUnit({
              amount: status.estimatedFees,
              account: mainAccount,
            }),
            errors: status.errors,
            warnings: status.warnings,
            customFeeConfig: config,
          };
        }

        return new Promise<{
          feesStrategy: string;
          estimatedFees: BigNumber | undefined;
          errors: object;
          warnings: object;
          customFeeConfig: object;
        }>(resolve => {
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
                customFeeConfig,
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
            });
          };

          setDrawer(
            FeesDrawerLiveApp,
            {
              setTransaction,
              mainAccount: fromAccount,
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
      from: sourceCurrency?.id,
      hasError: swapState?.error ? "true" : undefined, // append param only if error is true
      isMaxEnabled: isMaxEnabled,
      loading: swapState?.loading,
      networkFees: swapState?.estimatedFees,
      networkFeesCurrency: fromCurrency,
      provider: swapState?.provider,
      to: targetCurrency?.id,
      toAccountId: swapState?.toAccountId,
      fromAccountId: swapState?.fromAccountId,
      toNewTokenId: swapState?.toNewTokenId,
      feeStrategy: swapState?.feeStrategy,
      customFeeConfig: swapState?.customFeeConfig,
    };

    Object.entries(swapParams).forEach(([key, value]) => {
      if (value != null) {
        // Convert all values to string as URLSearchParams expects string values
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }, [
    addressFrom,
    addressTo,
    swapState,
    sourceCurrency?.id,
    isMaxEnabled,
    fromCurrency,
    targetCurrency?.id,
  ]);

  useEffect(() => {
    // Determine the new quote state based on network status
    setQuoteState?.({
      amountTo: undefined,
      counterValue: undefined,
      ...{
        swapError: isOffline ? new NetworkDown() : undefined,
      },
    });

    // This effect runs when the network status changes or the target account changes
    // when the toAccountId has changed, quote state should be reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkStatus, swapState?.toAccountId]);

  const webviewStyle = useMemo(
    () => ({ minHeight: windowContentSize.scrollHeight }),
    [windowContentSize.scrollHeight],
  );

  // return loader???
  if (!hasSwapState || isOffline) {
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
          webviewStyle={webviewStyle}
          manifest={{ ...manifest, url: `${manifest.url}#${hashString}` }}
          inputs={{
            theme: themeType,
            lang: locale,
            currencyTicker: fiatCurrency.ticker,
            discreetMode,
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
