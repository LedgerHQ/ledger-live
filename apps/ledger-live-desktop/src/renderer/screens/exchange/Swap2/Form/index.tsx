import { NotEnoughBalance, NotEnoughBalanceSwap } from "@ledgerhq/errors";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import {
  SetExchangeRateCallback,
  useIsSwapLiveApp,
  usePageState,
  useSwapLiveConfig,
  useSwapTransaction,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  maybeKeepTronAccountAlive,
  maybeTezosAccountUnrevealedAccount,
  maybeTronEmptyAccount,
} from "@ledgerhq/live-common/exchange/swap/index";
import { OnNoRatesCallback } from "@ledgerhq/live-common/exchange/swap/types";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import {
  convertToNonAtomicUnit,
  getCustomFeesPerFamily,
} from "@ledgerhq/live-common/exchange/swap/webApp/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { rateSelector, updateRateAction, updateTransactionAction } from "~/renderer/actions/swap";
import TrackPage from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { context } from "~/renderer/drawers/Provider";
import { useSwapLiveAppHook } from "~/renderer/hooks/swap-migrations/useSwapLiveAppHook";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { languageSelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useSwapLiveAppQuoteState } from "../hooks/useSwapLiveAppQuoteState";
import { trackSwapError, useGetSwapTrackingProperties } from "../utils/index";
import ExchangeDrawer from "./ExchangeDrawer/index";
import SwapFormSelectors from "./FormSelectors";
import { SwapMigrationUI } from "./Migrations/SwapMigrationUI";
import EmptyState from "./Rates/EmptyState";
import SwapWebView, { SwapWebProps } from "./SwapWebView";
import { useIsSwapLiveFlagEnabled } from "./useIsSwapLiveFlagEnabled";

const DAPP_PROVIDERS = ["paraswap", "oneinch", "moonpay"];

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 37rem;
  padding: 0.75rem ${({ theme }) => theme.space[4]}px 0;
  row-gap: 1rem;
  @media screen and (min-height: 1200px) {
    padding-top: 1rem;
    row-gap: 1.5rem;
  }
`;

const idleTime = 60 * 60000; // 1 hour

const SwapForm = () => {
  const language = useSelector(languageSelector);
  const [idleState, setIdleState] = useState(false);
  const dispatch = useDispatch();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const totalListedAccounts = useSelector(flattenAccountsSelector);
  const accounts = useSelector(shallowAccountsSelector);
  const exchangeRate = useSelector(rateSelector);
  const walletApiPartnerList = useFeature("swapWalletApiPartnerList");
  const ptxSwapReceiveTRC20WithoutTrx = useFeature("ptxSwapReceiveTRC20WithoutTrx");
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

  const swapLiveEnabledFlag = useSwapLiveConfig();
  const swapLiveAppManifestID = swapLiveEnabledFlag?.params?.manifest_id;
  const isDemo1Enabled = useIsSwapLiveFlagEnabled("ptxSwapLiveAppDemoOne");

  const swapTransaction = useSwapTransaction({
    accounts,
    setExchangeRate,
    onNoRates,
    isEnabled: !isDemo1Enabled,
    ...(locationState as object),
  });

  const isSwapLiveAppEnabled = useIsSwapLiveApp({
    currencyFrom: swapTransaction.swap.from.currency,
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
  const keepTronAccountAliveError = maybeKeepTronAccountAlive(swapTransaction);
  const swapError = keepTronAccountAliveError
    ? keepTronAccountAliveError
    : swapTransaction.fromAmountError instanceof NotEnoughBalance
      ? new NotEnoughBalanceSwap(swapTransaction.fromAmountError?.message)
      : swapTransaction.fromAmountError ||
        exchangeRatesState?.error ||
        maybeTezosAccountUnrevealedAccount(swapTransaction) ||
        (ptxSwapReceiveTRC20WithoutTrx?.enabled
          ? undefined
          : maybeTronEmptyAccount(swapTransaction));

  const swapWarning = swapTransaction.fromAmountWarning;
  const pageState = usePageState(swapTransaction, swapError);
  const provider = useMemo(() => exchangeRate?.provider, [exchangeRate?.provider]);
  const idleTimeout = useRef<NodeJS.Timeout | undefined>();
  const [swapWebProps, setSwapWebProps] = useState<SwapWebProps["swapState"] | undefined>(
    undefined,
  );
  const { setDrawer } = React.useContext(context);
  const walletState = useSelector(walletSelector);

  const getExchangeSDKParams = useCallback(() => {
    const { swap, transaction } = swapTransaction;
    const { to, from } = swap;
    const { account: fromAccount, parentAccount: fromParentAccount } = from;
    const { account: toAccount, parentAccount: toParentAccount } = to;
    const { feesStrategy } = transaction || {};
    const { rate, rateId } = exchangeRate || {};

    const isToAccountValid = totalListedAccounts.some(account => account.id === toAccount?.id);
    const fromAccountId =
      fromAccount && accountToWalletAPIAccount(walletState, fromAccount, fromParentAccount)?.id;
    const toAccountId = isToAccountValid
      ? toAccount && accountToWalletAPIAccount(walletState, toAccount, toParentAccount)?.id
      : toParentAccount && accountToWalletAPIAccount(walletState, toParentAccount, undefined)?.id;
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
    swapTransaction.swap.from.amount,
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
      moonpayURL.searchParams.set("language", language);

      // Theme ID is defined by moonpay to tweak styling to more more closely match
      // the existing theming within ledger live.
      moonpayURL.searchParams.set("themeId", "92be4cb6-a57f-407b-8b1f-bc8055b60c9b");
      return moonpayURL;
    },
    [language],
  );

  const getProviderRedirectURLSearch = useCallback(() => {
    const { account: fromAccount, parentAccount: fromParentAccount } = swapTransaction.swap.from;
    const providerRedirectFromAccountId =
      fromAccount &&
      provider &&
      walletApiPartnerList?.enabled &&
      walletApiPartnerList?.params?.list.includes(provider)
        ? accountToWalletAPIAccount(walletState, fromAccount, fromParentAccount)?.id
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
    walletState,
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
          ? accountToWalletAPIAccount(walletState, account, parentAccount)?.id
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
      walletState,
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

    track("button_clicked2", {
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
      // FIX LIVE-11283, Do not do this for polkadot as it is required to have transferAllowDeath set checked
      swapTransaction.transaction && swapTransaction.transaction.family !== "polkadot"
        ? (swapTransaction.transaction.useAllAmount = false)
        : null;
      // Fix LIVE-11660, remove the margin from thec fees
      swapTransaction.transaction && swapTransaction.transaction.family === "evm"
        ? (swapTransaction.transaction.additionalFees = undefined)
        : null;
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

  const untickMax = () => {
    swapTransaction.transaction?.useAllAmount ? swapTransaction.toggleMax() : null;
  };

  const setFromAccount = (account: AccountLike | undefined) => {
    untickMax();
    swapTransaction.setFromAccount(account);
  };

  const setFromAmount = useCallback(
    (amount: BigNumber) => {
      swapTransaction.setFromAmount(amount);
    },
    [swapTransaction],
  );

  const setToCurrency = (currency: TokenCurrency | CryptoCurrency | undefined) => {
    swapTransaction.setToCurrency(currency);
  };

  const toggleMax = () => {
    swapTransaction.toggleMax();
  };

  const reverseSwap = () => {
    untickMax();
    swapTransaction.reverseSwap();
  };

  const localManifest = useLocalLiveAppManifest(swapLiveAppManifestID || undefined);
  const remoteManifest = useRemoteLiveAppManifest(swapLiveAppManifestID || undefined);

  const manifest = localManifest || remoteManifest;
  useSwapLiveAppHook({
    isSwapLiveAppEnabled: isSwapLiveAppEnabled.enabled,
    manifestID: swapLiveAppManifestID,
    swapTransaction,
    updateSwapWebProps: setSwapWebProps,
    swapError,
    getExchangeSDKParams,
    getProviderRedirectURLSearch,
  });

  // used to get the Quotes Status from Demo 1 swap live app
  const [quoteState, setQuoteState] = useSwapLiveAppQuoteState({
    amountTo: exchangeRate?.toAmount,
    swapError,
    counterValue: undefined,
  });

  return (
    <Wrapper>
      <TrackPage category="Swap" name="Form" provider={provider} {...swapDefaultTrack} />
      <SwapFormSelectors
        fromAccount={sourceAccount}
        toAccount={swapTransaction.swap.to.account}
        fromAmount={swapTransaction.swap.from.amount}
        toCurrency={targetCurrency}
        toAmount={!isDemo1Enabled ? exchangeRate?.toAmount : quoteState.amountTo}
        setFromAccount={setFromAccount}
        setFromAmount={setFromAmount}
        setToCurrency={setToCurrency}
        isMaxEnabled={swapTransaction.swap.isMaxEnabled}
        toggleMax={toggleMax}
        fromAmountError={!isDemo1Enabled ? swapError : quoteState.swapError}
        counterValue={isDemo1Enabled ? quoteState.counterValue : undefined}
        fromAmountWarning={swapWarning}
        isSwapReversable={swapTransaction.swap.isSwapReversable}
        reverseSwap={reverseSwap}
        provider={provider}
        loadingRates={swapTransaction.swap.rates.status === "loading"}
        isSendMaxLoading={swapTransaction.swap.isMaxLoading}
        updateSelectedRate={swapTransaction.swap.updateSelectedRate}
      />
      {pageState === "empty" && <EmptyState />}
      <SwapMigrationUI
        manifestID={swapLiveAppManifestID}
        liveAppEnabled={isSwapLiveAppEnabled.enabled}
        liveApp={
          swapLiveAppManifestID && manifest ? (
            <SwapWebView
              setQuoteState={setQuoteState}
              sourceCurrency={sourceCurrency}
              targetCurrency={targetCurrency}
              manifest={manifest}
              swapState={swapWebProps}
              isMaxEnabled={swapTransaction.swap.isMaxEnabled}
              // When live app crash, it should disable live app and fall back to native UI
              liveAppUnavailable={isSwapLiveAppEnabled.onLiveAppCrashed}
            />
          ) : null
        }
        // Demo 1 props
        pageState={pageState}
        swapTransaction={swapTransaction}
        provider={provider}
        // Demo 0 props
        disabled={!isSwapReady}
        onClick={onSubmit}
      />
    </Wrapper>
  );
};

export default SwapForm;
