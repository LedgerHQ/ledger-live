import { checkQuote } from "@ledgerhq/live-common/exchange/swap/index";
import {
  usePollKYCStatus,
  useSwapProviders,
  useSwapTransaction,
  usePageState,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  getKYCStatusFromCheckQuoteStatus,
  getProviderName,
  KYC_STATUS,
  KYCStatus,
  getCustomDappUrl,
  shouldShowKYCBanner,
  shouldShowLoginBanner,
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { setSwapKYCStatus } from "~/renderer/actions/settings";
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
import { swapKYCSelector } from "~/renderer/reducers/settings";
import KYC from "../KYC";
import Login from "../Login";
import MFA from "../MFA";
import { trackSwapError, useGetSwapTrackingProperties } from "../utils/index";
import ExchangeDrawer from "./ExchangeDrawer/index";
import FormErrorBanner from "./FormErrorBanner";
import FormKYCBanner from "./FormKYCBanner";
import FormLoading from "./FormLoading";
import FormLoginBanner from "./FormLoginBanner";
import FormMFABanner from "./FormMFABanner";
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
import {
  ValidCheckQuoteErrorCodes,
  ValidKYCStatus,
} from "@ledgerhq/live-common/exchange/swap/types";
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
  // FIXME: should use enums for Flow and Banner values
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const [idleState, setIdleState] = useState(false);
  const [error, setError] = useState<ValidCheckQuoteErrorCodes | undefined>();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { state: locationState } = useLocation();
  const history = useHistory();
  const accounts = useSelector(shallowAccountsSelector);
  const { storedProviders, providersError } = useProviders();
  const exchangeRate = useSelector(rateSelector);
  const setExchangeRate = useCallback(
    rate => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );
  const walletApiPartnerList: Feature<{ list: Array<string> }> | null = useFeature(
    "swapWalletApiPartnerList",
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
  const swapKYC = useSelector(swapKYCSelector);
  const provider = exchangeRate?.provider;
  const providerKYC = (provider && swapKYC?.[provider]) || undefined;
  const kycStatus =
    (providerKYC && (providerKYC?.status as ValidKYCStatus | undefined)) || undefined;
  const idleTimeout = useRef<NodeJS.Timeout | undefined>();

  // On provider change, reset banner and flow
  useEffect(() => {
    setCurrentBanner(null);
    setCurrentFlow(null);
    setError(undefined);
  }, [provider]);
  useEffect(() => {
    // In case of error, don't show  login, kyc or mfa banner
    if (error) {
      // Don't show any flow banner on error to avoid double banner display
      setCurrentBanner(null);
      return;
    }

    // Don't display login nor kyc banner if user needs to complete MFA
    if (currentBanner === "MFA") {
      return;
    }
    if (
      shouldShowLoginBanner({
        provider,
        token: providerKYC?.id,
      })
    ) {
      setCurrentBanner("LOGIN");
      return;
    }

    // we display the KYC banner component if partner requiers KYC and is not yet approved
    // we don't display it if user needs to login first
    if (
      currentBanner !== "LOGIN" &&
      shouldShowKYCBanner({
        provider,
        kycStatus,
      })
    ) {
      setCurrentBanner("KYC");
    }
  }, [error, provider, providerKYC?.id, kycStatus, currentBanner]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapTransaction.transaction]);
  useEffect(() => {
    // Whenever an account is added, reselect the currency to pick a default target account.
    // (possibly the one that got created)
    if (swapTransaction.swap.to.currency && !swapTransaction.swap.to.account) {
      swapTransaction.setToCurrency(swapTransaction.swap.to.currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  // FIXME: update usePollKYCStatus to use checkQuote for KYC status (?)
  usePollKYCStatus(
    {
      provider,
      kyc: providerKYC,
      onChange: res => {
        dispatch(
          setSwapKYCStatus({
            provider: provider!, // provider should be defined - onChange is not supposed to be called if it's not
            id: res?.id,
            status: res?.status,
          }),
        );
      },
    },
    [dispatch],
  );

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

  // close login widget once we get a bearer token (i.e: the user is logged in)
  useEffect(() => {
    if (providerKYC?.id && currentFlow === "LOGIN") {
      setCurrentFlow(null);
    }
  }, [providerKYC?.id, currentFlow]);

  /**
   * FIXME
   * Too complicated, seems to handle to much things (KYC status + non KYC related errors)
   * KYC related stuff should be handled in usePollKYCStatus
   */
  useEffect(() => {
    if (
      !provider ||
      !providerKYC?.id ||
      !exchangeRate?.rateId ||
      currentFlow === "KYC" ||
      currentFlow === "MFA"
    ) {
      return;
    }
    const userId = providerKYC.id;
    const handleCheckQuote = async () => {
      const status = await checkQuote({
        provider,
        quoteId: exchangeRate.rateId,
        bearerToken: userId,
      });

      // User needs to complete MFA on partner own UI / dedicated widget
      if (status.codeName === "MFA_REQUIRED") {
        setCurrentBanner("MFA");
        return;
      } else {
        // No need to show MFA banner for other cases
        setCurrentBanner(null);
      }
      if (status.codeName === "RATE_VALID") {
        // If trade can be done and KYC already approved, we are good
        // PS: this can't be checked before the `checkQuote` call since a KYC status can become expierd
        if (kycStatus === KYC_STATUS.approved) {
          return;
        }

        // If status is ok, close login, kyc and mfa widgets even if open
        setCurrentFlow(null);
        dispatch(
          setSwapKYCStatus({
            provider,
            id: userId,
            status: KYC_STATUS.approved,
          }),
        );
        return;
      }

      // Handle all KYC related errors
      if (status.codeName.startsWith("KYC_")) {
        const updatedKycStatus = getKYCStatusFromCheckQuoteStatus(status);
        if (updatedKycStatus !== kycStatus) {
          dispatch(
            setSwapKYCStatus({
              provider,
              id: userId,
              status: updatedKycStatus,
            }),
          );
        }
        return;
      }

      // If user is unauthenticated, reset login and KYC state
      if (status.codeName === "UNAUTHENTICATED_USER") {
        dispatch(
          setSwapKYCStatus({
            provider,
            id: undefined,
            status: undefined,
          }),
        );
        return;
      }

      // If RATE_NOT_FOUND it means the quote as expired, so we need to refresh the rates
      if (status.codeName === "RATE_NOT_FOUND") {
        swapTransaction?.swap?.refetchRates();
        return;
      }

      // All other statuses are considered errors
      setError(status.codeName);
    };
    handleCheckQuote();
    /**
     * Remove `swapTransaction` from dependency list because it seems to mess up
     * with the `checkQuote` call (the endpoint gets called too often)
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerKYC, exchangeRate, dispatch, provider, kycStatus, currentFlow]);
  const isSwapReady =
    !error &&
    !swapTransaction.bridgePending &&
    exchangeRatesState.status !== "loading" &&
    swapTransaction.transaction &&
    !providersError &&
    !swapError &&
    !swapWarning &&
    !currentBanner &&
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
  switch (currentFlow) {
    case "LOGIN":
      return <Login provider={provider} onClose={() => setCurrentFlow(null)} />;
    case "KYC":
      return (
        <KYC
          provider={provider}
          onClose={() => {
            setCurrentFlow(null);
            /**
             * Need to reset current banner in order to not display a KYC
             * banner after completion of Wyre KYC
             */
            setCurrentBanner(null);
          }}
        />
      );
    case "MFA":
      return <MFA provider={provider} onClose={() => setCurrentFlow(null)} />;
    default:
      break;
  }
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
        {currentBanner === "LOGIN" ? (
          <FormLoginBanner provider={provider} onClick={() => setCurrentFlow("LOGIN")} />
        ) : null}
        {currentBanner === "KYC" ? (
          <FormKYCBanner
            provider={provider}
            status={kycStatus as KYCStatus}
            onClick={() => setCurrentFlow("KYC")}
          />
        ) : null}
        {currentBanner === "MFA" ? (
          <FormMFABanner provider={provider} onClick={() => setCurrentFlow("MFA")} />
        ) : null}
        {error ? <FormErrorBanner provider={provider} error={error} /> : null}
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
