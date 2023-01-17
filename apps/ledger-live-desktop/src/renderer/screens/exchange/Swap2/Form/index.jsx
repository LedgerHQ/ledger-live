// @flow
import { checkQuote } from "@ledgerhq/live-common/exchange/swap/index";
import {
  usePollKYCStatus,
  useSwapProviders,
  useSwapTransaction,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  getKYCStatusFromCheckQuoteStatus,
  KYC_STATUS,
  shouldShowKYCBanner,
  shouldShowLoginBanner,
  getProviderName,
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { setSwapKYCStatus } from "~/renderer/actions/settings";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
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
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import KYC from "../KYC";
import Login from "../Login";
import MFA from "../MFA";
import { swapDefaultTrack, trackSwapError } from "../utils/index";
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
import EmptyState from "./Rates/EmptyState";
import debounce from "lodash/debounce";

const Wrapper: ThemedComponent<{}> = styled(Box).attrs({
  p: 20,
  mt: 12,
})`
  row-gap: 2rem;
  max-width: 37rem;
`;

const refreshTime = 30000;
const idleTime = 60 * 60000; // 1 hour

const Button = styled(ButtonBase)`
  justify-content: center;
`;

const trackNoRates = ({ toState }) => {
  track("error_message", {
    message: "no_rates",
    page: "Page Swap Form",
    ...swapDefaultTrack,
    sourceCurrency: toState.currency?.name,
  });
};

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
  const [currentFlow, setCurrentFlow] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [isSendMaxLoading, setIsSendMaxLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [idleState, setIdleState] = useState(false);
  const [firstRateId, setFirstRateId] = useState(null);

  const [error, setError] = useState();
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
  const showDexQuotes: boolean | null = useFeature("swapShowDexQuotes");

  const swapTransaction = useSwapTransaction({
    accounts,
    setExchangeRate,
    setIsSendMaxLoading,
    onNoRates: trackNoRates,
    ...locationState,
    providers: storedProviders,
    includeDEX: showDexQuotes?.enabled || false,
  });

  const exchangeRatesState = swapTransaction.swap?.rates;
  const swapKYC = useSelector(swapKYCSelector);

  const provider = exchangeRate?.provider;
  const providerKYC = swapKYC?.[provider];
  const kycStatus = providerKYC?.status;

  const idleTimeout = useRef();
  const refreshInterval = useRef();

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

    if (shouldShowLoginBanner({ provider, token: providerKYC?.id })) {
      setCurrentBanner("LOGIN");
      return;
    }

    // we display the KYC banner component if partner requiers KYC and is not yet approved
    // we don't display it if user needs to login first
    if (currentBanner !== "LOGIN" && shouldShowKYCBanner({ provider, kycStatus })) {
      setCurrentBanner("KYC");
    }
  }, [error, provider, providerKYC?.id, kycStatus, currentBanner]);

  const { setDrawer } = React.useContext(context);

  const swapError = swapTransaction.fromAmountError || exchangeRatesState?.error;

  useEffect(() => {
    const newFirstRateId = swapTransaction?.swap?.rates?.value?.length
      ? swapTransaction.swap.rates.value[0].rateId
      : null;
    setFirstRateId(newFirstRateId);
  }, [swapTransaction]);

  useEffect(() => {
    refreshInterval.current && clearInterval(refreshInterval.current);
    refreshInterval.current = setInterval(() => {
      !swapError && !idleState && swapTransaction?.swap?.refetchRates();
    }, refreshTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapError, firstRateId]);

  useEffect(() => {
    setShowEmpty(swapError && swapError?.message.length === 0);
  }, [swapError]);

  const refreshIdle = useCallback(() => {
    idleState && setIdleState(false);
    idleTimeout.current && clearInterval(idleTimeout.current);
    idleTimeout.current = setTimeout(() => {
      setIdleState(true);
    }, idleTime);
  }, [idleState]);

  useEffect(() => {
    if (!showDetails && swapTransaction.swap.rates.status !== "loading") {
      refreshIdle();
      setShowDetails(true);
    }
  }, [refreshIdle, showDetails, swapTransaction.swap.rates.status]);

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
            provider: provider,
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
      swapError &&
        trackSwapError(swapError, {
          page: "Page Swap Form",
          ...swapDefaultTrack,
          sourcecurrency: swapTransaction.swap.from.currency?.name,
          provider,
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swapError],
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
    !currentBanner &&
    exchangeRate &&
    swapTransaction.swap.to.account &&
    swapTransaction.swap.from.amount &&
    swapTransaction.swap.from.amount.gt(0);

  const onSubmit = () => {
    track("button_clicked", {
      button: "Request",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      sourceCurrency: sourceCurrency?.name,
      targetCurrency: targetCurrency?.name,
      partner: provider,
    });

    if (exchangeRate.providerType === "DEX") {
      const from = swapTransaction.swap.from;
      const fromAddress = from.parentAccount?.id || from.account.id;
      const providerURL =
        exchangeRate.providerURL ||
        `/platform/${getProviderName(exchangeRate.provider).toLowerCase()}`;
      history.push({
        pathname: providerURL,
        params: {
          returnTo: "/swap",
          accountId: fromAddress,
        },
      });
    } else {
      setDrawer(ExchangeDrawer, { swapTransaction, exchangeRate }, { preventBackdropClick: true });
    }
  };

  const sourceAccount = swapTransaction.swap.from.account;
  const sourceCurrency = swapTransaction.swap.from.currency;
  const sourceParentAccount = swapTransaction.swap.from.parentAccount;
  const targetAccount = swapTransaction.swap.to.account;
  const targetParentAccount = swapTransaction.swap.to.parentAccount;
  const targetCurrency = swapTransaction.swap.to.currency;

  // We check if a decentralized swap is available to conditionnaly render an Alert below.
  // All Ethereum, Binance and Polygon related currencies are considered available
  const showNoQuoteDexRate = useMemo(() => {
    // if we are showing DEX quotes, we don't want to show the link banners
    if (showDexQuotes?.enabled) {
      return false;
    }

    if (sourceAccount && targetAccount) {
      const sourceMainAccount = getMainAccount(sourceAccount, sourceParentAccount);
      const targetMainAccount = getMainAccount(targetAccount, targetParentAccount);

      const dexFamilyList = ["ethereum", "bsc", "polygon"];
      if (
        dexFamilyList.includes(targetMainAccount.currency.id) &&
        sourceMainAccount.currency.id === targetMainAccount.currency.id &&
        sourceMainAccount.currency.family === targetMainAccount.currency.family
      ) {
        return true;
      }
    }
    return false;
  }, [showDexQuotes, sourceAccount, sourceParentAccount, targetAccount, targetParentAccount]);

  useEffect(() => {
    if (!exchangeRate) {
      swapTransaction.swap.updateSelectedRate({});
      return;
    }

    swapTransaction.swap.updateSelectedRate(exchangeRate);
    // suppressing as swapTransaction is not memoized and causes infinite loop
    // eslint-disable-next-line
  }, [exchangeRate]);

  const debouncedSetFromAmount = useMemo(
    () =>
      debounce((amount: BigNumber) => {
        setShowDetails(false);
        swapTransaction.setFromAmount(amount);
      }, 400),
    // cannot depend on swapTransaction as it'll change when new `rates` are fetched
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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

  const setFromAccount = currency => {
    setShowDetails(false);
    swapTransaction.setFromAccount(currency);
  };

  const setToAccount = account => {
    setShowDetails(false);
    swapTransaction.setToAccount(account);
  };

  const setToCurrency = currency => {
    setShowDetails(false);
    swapTransaction.setToCurrency(currency);
  };

  const toggleMax = state => {
    setShowDetails(false);
    swapTransaction.toggleMax(state);
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
          toAmount={exchangeRate?.toAmount || null}
          setFromAccount={setFromAccount}
          setFromAmount={debouncedSetFromAmount}
          setToAccount={setToAccount}
          setToCurrency={setToCurrency}
          isMaxEnabled={swapTransaction.swap.isMaxEnabled}
          toggleMax={toggleMax}
          fromAmountError={swapError}
          isSwapReversable={swapTransaction.swap.isSwapReversable}
          reverseSwap={swapTransaction.reverseSwap}
          provider={provider}
          loadingRates={swapTransaction.swap.rates.status === "loading"}
          isSendMaxLoading={isSendMaxLoading}
          updateSelectedRate={swapTransaction.swap.updateSelectedRate}
        />
        {showEmpty && <EmptyState />}
        {showDetails && !showEmpty && (
          <>
            <SwapFormSummary
              swapTransaction={swapTransaction}
              kycStatus={kycStatus}
              provider={provider}
            />
            <SwapFormRates
              swap={swapTransaction.swap}
              provider={provider}
              refreshTime={refreshTime}
              countdown={!swapError && !idleState}
              showNoQuoteDexRate={showNoQuoteDexRate}
            />

            {currentBanner === "LOGIN" ? (
              <FormLoginBanner provider={provider} onClick={() => setCurrentFlow("LOGIN")} />
            ) : null}

            {currentBanner === "KYC" ? (
              <FormKYCBanner
                provider={provider}
                status={kycStatus}
                onClick={() => setCurrentFlow("KYC")}
              />
            ) : null}

            {currentBanner === "MFA" ? (
              <FormMFABanner provider={provider} onClick={() => setCurrentFlow("MFA")} />
            ) : null}

            {error ? <FormErrorBanner provider={provider} error={error} /> : null}
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
