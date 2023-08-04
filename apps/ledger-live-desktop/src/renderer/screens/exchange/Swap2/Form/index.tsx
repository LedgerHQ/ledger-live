import {
  useSwapProviders,
  useSwapTransaction,
  usePageState,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { getProviderName, getCustomDappUrl } from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { getParentAccount, isTokenAccount } from "@ledgerhq/live-common/account/index";
import {
  providersSelector,
  rateSelector,
  resetSwapAction,
  updateProvidersAction,
  updateRateAction,
  updateTransactionAction,
} from "~/renderer/actions/swap";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import ButtonBase from "~/renderer/components/Button";
import { context } from "~/renderer/drawers/Provider";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { trackSwapError, useGetSwapTrackingProperties } from "../utils/index";
import ExchangeDrawer from "./ExchangeDrawer/index";
import FormLoading from "./FormLoading";
import FormNotAvailable from "./FormNotAvailable";
import SwapFormSelectors from "./FormSelectors";
import SwapFormSummary from "./FormSummary";
import SwapFormRates from "./FormRates";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import useRefreshRates from "./hooks/useRefreshRates";
import LoadingState from "./Rates/LoadingState";
import EmptyState from "./Rates/EmptyState";
import { AccountLike, Feature } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SwapSelectorStateType } from "@ledgerhq/live-common/exchange/swap/types";
import { SWAP_RATES_TIMEOUT } from "../../config";

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

export const useProviders = () => {
  const dispatch = useDispatch();
  const { providers, error: providersError } = useSwapProviders();
  const storedProviders = useSelector(providersSelector);
  useEffect(() => {
    if (providers) dispatch(updateProvidersAction(providers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);
  useEffect(() => {
    if (providersError) dispatch(resetSwapAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersError]);
  return {
    storedProviders,
    providers,
    providersError,
  };
};

const SwapForm = () => {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const [idleState, setIdleState] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const accounts = useSelector(shallowAccountsSelector);
  const { storedProviders, providersError } = useProviders();
  const exchangeRate = useSelector(rateSelector);
  const walletApiPartnerList: Feature<{ list: Array<string> }> | null = useFeature(
    "swapWalletApiPartnerList",
  );

  const setExchangeRate = useCallback(
    rate => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );

  const onNoRates = useCallback(
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
    providers: storedProviders || undefined,
    timeout: SWAP_RATES_TIMEOUT,
    timeoutErrorMessage: t("swap2.form.timeout.message"),
  });

  const exchangeRatesState = swapTransaction.swap?.rates;
  const swapError = swapTransaction.fromAmountError || exchangeRatesState?.error;
  const swapWarning = swapTransaction.fromAmountWarning;
  const pageState = usePageState(swapTransaction, swapError);
  const provider = exchangeRate?.provider;
  const idleTimeout = useRef<NodeJS.Timeout | undefined>();

  const { setDrawer } = React.useContext(context);

  const pauseRefreshing = !!swapError || idleState;
  const refreshTime = useRefreshRates(swapTransaction.swap, {
    pause: pauseRefreshing,
  });
  const refreshIdle = useCallback(() => {
    idleState && setIdleState(false);
    idleTimeout.current && clearInterval(idleTimeout.current);
    idleTimeout.current = setTimeout(() => {
      setIdleState(true);
    }, idleTime);
  }, [idleState]);

  const swapWebAppRedirection = useCallback(() => {
    const { to, from } = swapTransaction.swap;
    const transaction = swapTransaction.transaction;
    const { account: fromAccount, parentAccount: fromParentAccount } = from;
    const { account: toAccount, parentAccount: toParentAccount } = to;
    const feesStrategy = transaction?.feesStrategy;
    const rateId = exchangeRate?.rateId || "1234";
    if (fromAccount && toAccount && feesStrategy) {
      const fromAccountId = accountToWalletAPIAccount(fromAccount, fromParentAccount)?.id;
      const toAccountId = accountToWalletAPIAccount(toAccount, toParentAccount)?.id;
      const fromMagnitude =
        (fromAccount as unknown as SwapSelectorStateType)?.currency?.units[0].magnitude || 0;
      const fromAmount = transaction?.amount.shiftedBy(-fromMagnitude);

      history.push({
        pathname: "/swap-web",
        state: {
          provider,
          fromAccountId,
          toAccountId,
          fromAmount,
          quoteId: encodeURIComponent(rateId),
          feeStrategy: feesStrategy.toUpperCase(), // Custom fee is not supported yet
        },
      });
    }
  }, [history, swapTransaction, provider, exchangeRate?.rateId]);

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
    !providersError &&
    !swapError &&
    exchangeRate &&
    swapTransaction.swap.to.account &&
    swapTransaction.swap.from.amount &&
    swapTransaction.swap.from.amount.gt(0);
  const onSubmit = () => {
    if (!exchangeRate) return;

    const { provider, providerURL, providerType } = exchangeRate;
    track("button_clicked", {
      button: "Request",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      sourceCurrency: sourceCurrency?.name,
      targetCurrency: targetCurrency?.name,
      partner: provider,
    });

    if (providerType === "DEX") {
      const from = swapTransaction.swap.from;
      const fromAccountId = from.parentAccount?.id || from.account?.id;
      const customParams = {
        provider,
        providerURL,
      } as {
        provider: string;
        providerURL?: string;
      };
      const customDappUrl = getCustomDappUrl(customParams);
      const pathname = `/platform/${getProviderName(provider).toLowerCase()}`;
      const getAccountId = ({
        accountId,
        provider,
      }: {
        accountId: string | undefined;
        provider: string;
      }) => {
        if (
          !walletApiPartnerList?.enabled ||
          !walletApiPartnerList?.params?.list.includes(provider)
        ) {
          return accountId;
        }
        const account = accounts.find(a => a.id === accountId);
        if (!account) return accountId;
        const parentAccount = isTokenAccount(account)
          ? getParentAccount(account, accounts)
          : undefined;
        const walletApiId = accountToWalletAPIAccount(account, parentAccount)?.id;
        return walletApiId || accountId;
      };
      const accountId = getAccountId({ accountId: fromAccountId, provider });
      history.push({
        // This looks like an issue, the proper signature is: push(path, [state]) - (function) Pushes a new entry onto the history stack
        // It seems possible to also pass a LocationDescriptorObject but it does not expect extra properties
        // @ts-expect-error so customDappUrl is not expected to be here
        customDappUrl,
        pathname,
        state: {
          returnTo: "/swap",
          accountId,
        },
      });
    } else {
      const swapWebApp = !!process.env.SWAP_WEB_APP;
      if (swapWebApp) {
        swapWebAppRedirection();
      } else {
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
    }
  };
  const sourceAccount = swapTransaction.swap.from.account;
  const sourceCurrency = swapTransaction.swap.from.currency;
  const targetCurrency = swapTransaction.swap.to.currency;

  useEffect(() => {
    if (!exchangeRate) {
      // @ts-expect-error This seems like a mistake? updateSelectedRate expects an ExchangeRate
      swapTransaction.swap.updateSelectedRate({});
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

  if (storedProviders?.length)
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

        <Box>
          <Button primary disabled={!isSwapReady} onClick={onSubmit} data-test-id="exchange-button">
            {t("common.exchange")}
          </Button>
        </Box>
      </Wrapper>
    );

  // TODO: ensure that the error is catch by Sentry in this case
  if (storedProviders?.length === 0 || providersError) {
    return (
      <>
        <FormNotAvailable />
      </>
    );
  }
  return <FormLoading />;
};

export default SwapForm;
