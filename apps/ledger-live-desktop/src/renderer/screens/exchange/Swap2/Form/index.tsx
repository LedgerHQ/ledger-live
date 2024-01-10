import {
  useSwapTransaction,
  usePageState,
  useIsSwapLiveApp,
  SetExchangeRateCallback,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  getCustomFeesPerFamily,
  convertToNonAtomicUnit,
} from "@ledgerhq/live-common/exchange/swap/webApp/index";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { rateSelector, updateRateAction, updateTransactionAction } from "~/renderer/actions/swap";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import ButtonBase from "~/renderer/components/Button";
import { context } from "~/renderer/drawers/Provider";
import { shallowAccountsSelector, flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { trackSwapError, useGetSwapTrackingProperties } from "../utils/index";
import ExchangeDrawer from "./ExchangeDrawer/index";
import SwapFormSelectors from "./FormSelectors";
import SwapFormSummary from "./FormSummary";
import SwapFormRates from "./FormRates";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import useRefreshRates from "./hooks/useRefreshRates";
import LoadingState from "./Rates/LoadingState";
import EmptyState from "./Rates/EmptyState";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SWAP_RATES_TIMEOUT } from "../../config";
import { OnNoRatesCallback } from "@ledgerhq/live-common/exchange/swap/types";
import { v4 } from "uuid";
import SwapWebView, { SWAP_WEB_MANIFEST_ID, SwapWebProps } from "./SwapWebView";

const DAPP_PROVIDERS = ["paraswap", "oneinch", "moonpay"];

const Wrapper = styled(Box).attrs({
  p: 20,
  mt: 12,
})`
  row-gap: 2rem;
  max-width: 37rem;
`;

const Hide = styled.div`
  opacity: 0;
`;

const idleTime = 60 * 60000; // 1 hour

const Button = styled(ButtonBase)`
  justify-content: center;
`;

const SwapForm = () => {
  const [idleState, setIdleState] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const accounts = useSelector(shallowAccountsSelector);
  const totalListedAccounts = useSelector(flattenAccountsSelector);
  const exchangeRate = useSelector(rateSelector);
  const walletApiPartnerList = useFeature("swapWalletApiPartnerList");
  const swapDefaultTrack = useGetSwapTrackingProperties();

  const setExchangeRate: SetExchangeRateCallback = useCallback(
    rate => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );

  const onNoRates: OnNoRatesCallback = useCallback(
    ({ toState }) => {
      track("error_message", {
        message: "no_rates",
        page: "Page Swap Form",
        ...swapDefaultTrack,
        sourceCurrency: toState.currency?.name,
      });
    },
    [swapDefaultTrack],
  );

  const swapTransaction = useSwapTransaction({
    accounts,
    setExchangeRate,
    onNoRates,
    ...(locationState as object),
    timeout: SWAP_RATES_TIMEOUT,
    timeoutErrorMessage: t("swap2.form.timeout.message"),
  });

  const isSwapLiveAppEnabled = useIsSwapLiveApp({
    currencyFrom: swapTransaction.swap.from.currency,
    swapWebManifestId: SWAP_WEB_MANIFEST_ID,
  });

  // @TODO: Try to check if we can directly have the right state from `useSwapTransaction`
  // Used to set the fake transaction recipient
  // As of today, we need to call setFromAccount to trigger an updateTransaction
  // in order to set the correct recipient address (abandonSeed address)
  // cf. https://github.com/LedgerHQ/ledger-live/blob/c135c887b313ecc9f4a3b3a421ced0e3a081dc37/libs/ledger-live-common/src/exchange/swap/hooks/useFromState.ts#L50-L57
  useEffect(() => {
    if (swapTransaction.account) {
      swapTransaction.setFromAccount(swapTransaction.account);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exchangeRatesState = swapTransaction.swap?.rates;
  const swapError = swapTransaction.fromAmountError || exchangeRatesState?.error;
  const swapWarning = swapTransaction.fromAmountWarning;
  const pageState = usePageState(swapTransaction, swapError);
  const provider = useMemo(() => exchangeRate?.provider, [exchangeRate?.provider]);
  const idleTimeout = useRef<NodeJS.Timeout | undefined>();
  const [swapWebProps, setSwapWebProps] = useState<SwapWebProps["swapState"] | undefined>(
    undefined,
  );

  const { setDrawer } = React.useContext(context);

  const pauseRefreshing = !!swapError || idleState;
  const refreshTime = useRefreshRates(swapTransaction.swap, {
    pause: pauseRefreshing,
  });

  const getExchangeSDKParams = useCallback(() => {
    const { swap, transaction } = swapTransaction;
    const { to, from } = swap;
    const { account: fromAccount, parentAccount: fromParentAccount } = from;
    const { account: toAccount, parentAccount: toParentAccount } = to;
    const { feesStrategy } = transaction || {};
    const { rate, rateId } = exchangeRate || {};

    const isToAccountValid = totalListedAccounts.some(account => account.id === toAccount?.id);
    const fromAccountId =
      fromAccount && accountToWalletAPIAccount(fromAccount, fromParentAccount)?.id;
    const toAccountId = isToAccountValid
      ? toAccount && accountToWalletAPIAccount(toAccount, toParentAccount)?.id
      : toParentAccount && accountToWalletAPIAccount(toParentAccount, undefined)?.id;
    const toNewTokenId =
      !isToAccountValid && toAccount?.type === "TokenAccount" ? toAccount.token?.id : undefined;
    const fromAmount =
      fromAccount &&
      convertToNonAtomicUnit({
        amount: transaction?.amount,
        account: fromAccount,
      });

    const customFeeConfig = transaction && getCustomFeesPerFamily(transaction);
    // The Swap web app will automatically recreate the transaction with "default" fees.
    // However, if you wish to use a different fee type, you will need to set it as custom.
    const feeStrategyParam =
      feesStrategy && ["slow", "fast", "custom"].includes(feesStrategy) ? "CUSTOM" : "MEDIUM";

    return {
      fromAccountId,
      toAccountId,
      fromAmount: fromAmount?.toString(),
      quoteId: rateId ? rateId : undefined,
      rate: rate?.toString(),
      feeStrategy: feeStrategyParam,
      customFeeConfig: customFeeConfig ? JSON.stringify(customFeeConfig) : undefined,
      toNewTokenId,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    provider,
    swapTransaction.swap.from.account?.id,
    swapTransaction.swap.to.currency?.id,
    swapTransaction.swap.to.account?.id,
    exchangeRate?.providerType,
    exchangeRate?.tradeMethod,
    exchangeRate?.providerURL,
    exchangeRate,
    totalListedAccounts,
  ]);

  const generateMoonpayUrl = useCallback(
    ({ base = "", args = {} }: { base: string; args: { [key: string]: string | undefined } }) => {
      const moonpayURL = new URL(base || "");
      moonpayURL.searchParams.append("ledgerlive", `${true}`);
      Object.entries(args).forEach(
        ([key, value]) =>
          // customFeeConfig is an object
          value &&
          moonpayURL.searchParams.append(
            ...[key, typeof value === "object" ? JSON.stringify(value) : value],
          ),
      );
      return moonpayURL;
    },
    [],
  );

  const getProviderRedirectURLSearch = useCallback(() => {
    const { account: fromAccount, parentAccount: fromParentAccount } = swapTransaction.swap.from;
    const providerRedirectFromAccountId =
      fromAccount &&
      provider &&
      walletApiPartnerList?.enabled &&
      walletApiPartnerList?.params?.list.includes(provider)
        ? accountToWalletAPIAccount(fromAccount, fromParentAccount)?.id
        : fromAccount?.id;

    const providerRedirectURLSearch = new URLSearchParams();

    providerRedirectFromAccountId &&
      providerRedirectURLSearch.set("accountId", providerRedirectFromAccountId);

    if (provider === "moonpay") {
      const moonpayURL = generateMoonpayUrl({
        base: exchangeRate?.providerURL || "",
        args: getExchangeSDKParams(),
      });

      exchangeRate?.providerURL && providerRedirectURLSearch.set("goToURL", moonpayURL.toString());
    } else {
      exchangeRate?.providerURL &&
        providerRedirectURLSearch.set("customDappUrl", exchangeRate.providerURL || "");
    }

    providerRedirectURLSearch.set("returnTo", "/swap");
    return providerRedirectURLSearch;
  }, [
    provider,
    swapTransaction.swap.from,
    exchangeRate?.providerURL,
    generateMoonpayUrl,
    getExchangeSDKParams,
    walletApiPartnerList?.enabled,
    walletApiPartnerList?.params?.list,
  ]);

  const refreshIdle = useCallback(() => {
    idleState && setIdleState(false);
    idleTimeout.current && clearInterval(idleTimeout.current);
    idleTimeout.current = setTimeout(() => {
      setIdleState(true);
    }, idleTime);
  }, [idleState]);

  const redirectToProviderApp = useCallback(
    (provider: string = ""): void => {
      const { providerURL } = exchangeRate ?? {};
      const from = swapTransaction.swap.from;
      const fromAccountId = from.parentAccount?.id || from.account?.id;

      const pathname = `/platform/${getProviderName(provider).toLowerCase()}`;

      const account = accounts.find(a => a.id === fromAccountId);
      if (!account) return;
      const parentAccount = isTokenAccount(account)
        ? getParentAccount(account, accounts)
        : undefined;

      const accountId =
        walletApiPartnerList?.enabled && walletApiPartnerList?.params?.list.includes(provider)
          ? accountToWalletAPIAccount(account, parentAccount)?.id
          : fromAccountId;

      const state: {
        returnTo: string;
        accountId?: string;
        goToURL?: string;
        customDappUrl?: string;
      } = {
        returnTo: "/swap",
        accountId,
        customDappUrl: providerURL,
      };

      if (provider === "moonpay") {
        const moonpayURL = generateMoonpayUrl({
          base: exchangeRate?.providerURL || "",
          args: getExchangeSDKParams(),
        });
        state.customDappUrl = undefined;
        state.goToURL = moonpayURL.toString();
      }

      history.push({
        // This looks like an issue, the proper signature is: push(path, [state]) - (function) Pushes a new entry onto the history stack
        pathname,
        state,
      });
    },
    [
      accounts,
      exchangeRate,
      generateMoonpayUrl,
      getExchangeSDKParams,
      history,
      swapTransaction.swap.from,
      walletApiPartnerList?.enabled,
      walletApiPartnerList?.params?.list,
    ],
  );

  useEffect(() => {
    if (swapTransaction.swap.rates.status === "success") {
      refreshIdle();
    }
  }, [refreshIdle, swapTransaction.swap.rates.status]);

  useEffect(() => {
    dispatch(updateTransactionAction(swapTransaction.transaction));
  }, [swapTransaction.transaction, dispatch]);

  useEffect(() => {
    // Whenever an account is added, reselect the currency to pick a default target account.
    // (possibly the one that got created)
    if (swapTransaction.swap.to.currency && !swapTransaction.swap.to.account) {
      swapTransaction.setToCurrency(swapTransaction.swap.to.currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  // Track errors
  useEffect(
    () => {
      (swapError || swapWarning) &&
        trackSwapError(swapError! || swapWarning!, {
          page: "Page Swap Form",
          ...swapDefaultTrack,
          sourcecurrency: swapTransaction.swap.from.currency?.name,
          provider,
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swapError, swapWarning],
  );

  const isSwapReady =
    !swapTransaction.bridgePending &&
    exchangeRatesState.status !== "loading" &&
    swapTransaction.transaction &&
    !swapError &&
    exchangeRate &&
    swapTransaction.swap.to.account &&
    swapTransaction.swap.from.amount &&
    swapTransaction.swap.from.amount.gt(0);

  const onSubmit = () => {
    if (!exchangeRate) return;

    track("button_clicked", {
      button: "Request",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      sourceCurrency: sourceCurrency?.name,
      targetCurrency: targetCurrency?.name,
      partner: provider,
    });

    if (provider && DAPP_PROVIDERS.includes(provider)) {
      redirectToProviderApp(provider);
    } else {
      // Fix LIVE-9064, prevent the transaction from being updated when using useAllAmount
      swapTransaction.transaction ? (swapTransaction.transaction.useAllAmount = false) : null;
      setDrawer(
        ExchangeDrawer,
        {
          swapTransaction,
          exchangeRate,
        },
        {
          preventBackdropClick: true,
        },
      );
    }
  };

  const sourceAccount = swapTransaction.swap.from.account;
  const sourceCurrency = swapTransaction.swap.from.currency;
  const targetCurrency = swapTransaction.swap.to.currency;

  useEffect(() => {
    if (!exchangeRate) {
      return;
    }
    swapTransaction.swap.updateSelectedRate(exchangeRate);
    // suppressing as swapTransaction is not memoized and causes infinite loop
    // eslint-disable-next-line
  }, [exchangeRate]);

  const setFromAccount = (account: AccountLike | undefined) => {
    swapTransaction.setFromAccount(account);
  };

  const setFromAmount = (amount: BigNumber) => {
    swapTransaction.setFromAmount(amount);
  };

  const setToCurrency = (currency: TokenCurrency | CryptoCurrency | undefined) => {
    swapTransaction.setToCurrency(currency);
  };

  const toggleMax = () => {
    swapTransaction.toggleMax();
  };

  useEffect(() => {
    if (isSwapLiveAppEnabled.enabled) {
      const providerRedirectURLSearch = getProviderRedirectURLSearch();
      const { parentAccount: fromParentAccount } = swapTransaction.swap.from;
      const fromParentAccountId = fromParentAccount
        ? accountToWalletAPIAccount(fromParentAccount)?.id
        : undefined;
      const providerRedirectURL = `ledgerlive://discover/${getProviderName(
        provider ?? "",
      ).toLowerCase()}?${providerRedirectURLSearch.toString()}`;
      setSwapWebProps({
        provider,
        ...getExchangeSDKParams(),
        fromParentAccountId,
        cacheKey: v4(),
        error: !!swapError,
        loading: swapTransaction.bridgePending || exchangeRatesState.status === "loading",
        providerRedirectURL,
      });
    }
  }, [
    provider,
    isSwapLiveAppEnabled.enabled,
    getExchangeSDKParams,
    getProviderRedirectURLSearch,
    swapTransaction.swap.from,
    swapError,
    swapTransaction.bridgePending,
    exchangeRatesState.status,
  ]);

  return (
    <Wrapper>
      <TrackPage category="Swap" name="Form" provider={provider} {...swapDefaultTrack} />
      <SwapFormSelectors
        fromAccount={sourceAccount}
        toAccount={swapTransaction.swap.to.account}
        fromAmount={swapTransaction.swap.from.amount}
        toCurrency={targetCurrency}
        toAmount={exchangeRate?.toAmount}
        setFromAccount={setFromAccount}
        setFromAmount={setFromAmount}
        setToCurrency={setToCurrency}
        isMaxEnabled={swapTransaction.swap.isMaxEnabled}
        toggleMax={toggleMax}
        fromAmountError={swapError}
        fromAmountWarning={swapWarning}
        isSwapReversable={swapTransaction.swap.isSwapReversable}
        reverseSwap={swapTransaction.reverseSwap}
        provider={provider}
        loadingRates={swapTransaction.swap.rates.status === "loading"}
        isSendMaxLoading={swapTransaction.swap.isMaxLoading}
        updateSelectedRate={swapTransaction.swap.updateSelectedRate}
      />
      {pageState === "empty" && <EmptyState />}
      {pageState === "loading" && <LoadingState />}
      {pageState === "initial" && (
        <Hide>
          <LoadingState />
        </Hide>
      )}

      {pageState === "loaded" && (
        <>
          <SwapFormSummary swapTransaction={swapTransaction} provider={provider} />
          <SwapFormRates
            swap={swapTransaction.swap}
            provider={provider}
            refreshTime={refreshTime}
            countdown={!pauseRefreshing}
          />
        </>
      )}

      {isSwapLiveAppEnabled.enabled ? (
        <SwapWebView
          swapState={swapWebProps}
          liveAppUnavailable={isSwapLiveAppEnabled.onLiveAppCrashed}
        />
      ) : (
        <Box>
          <Button primary disabled={!isSwapReady} onClick={onSubmit} data-test-id="exchange-button">
            {t("common.exchange")}
          </Button>
        </Box>
      )}
    </Wrapper>
  );
};

export default SwapForm;
