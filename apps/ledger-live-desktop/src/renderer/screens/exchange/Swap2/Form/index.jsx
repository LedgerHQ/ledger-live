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
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import { setSwapKYCStatus } from "~/renderer/actions/settings";
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
import { DEX_PROVIDERS } from "~/renderer/screens/exchange/Swap2/Form/utils";

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
  const swapTransaction = useSwapTransaction({
    accounts,
    setExchangeRate,
    setIsSendMaxLoading,
    onNoRates: trackNoRates,
    ...locationState,
    providers: storedProviders,
    includeDEX: true,
  });

  const exchangeRatesState = swapTransaction.swap?.rates;
  const swapKYC = useSelector(swapKYCSelector);
  const [navigation, setNavigation] = useState(null);

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
    if (error || navigation) {
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
  }, [error, provider, providerKYC?.id, kycStatus, currentBanner, navigation]);

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
    if (navigation) {
      const { pathname, params } = navigation;
      history.push({
        pathname,
        search: new URLSearchParams({
          returnTo: "/swap",
          ...params,
        }).toString(),
      });
    } else {
      setDrawer(ExchangeDrawer, { swapTransaction, exchangeRate }, { preventBackdropClick: true });
    }
  };

  const sourceAccount = swapTransaction.swap.from.account;
  const sourceCurrency = swapTransaction.swap.from.currency;
  const targetCurrency = swapTransaction.swap.to.currency;

  useEffect(() => {
    if (!exchangeRate) {
      setNavigation(null);
      swapTransaction.swap.updateSelectedRate({});
      return;
    }

    const { providerType } = exchangeRate;
    if (providerType === "DEX") {
      const dexProvider = DEX_PROVIDERS.find(d => d.id === exchangeRate.provider);
      if (dexProvider) {
        setNavigation(dexProvider.navigation);
      }
    }

    if (providerType === "CEX") {
      setNavigation(null);
      swapTransaction.swap.updateSelectedRate(exchangeRate);
    }
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

  const setFromAccount = currency => {
    setNavigation(null);
    setShowDetails(false);
    swapTransaction.setFromAccount(currency);
  };

  const setFromAmount = currency => {
    setNavigation(null);
    setShowDetails(false);
    swapTransaction.setFromAmount(currency);
  };

  const setToAccount = account => {
    setNavigation(null);
    setShowDetails(false);
    swapTransaction.setToAccount(account);
  };

  const setToCurrency = currency => {
    setNavigation(null);
    setShowDetails(false);
    swapTransaction.setToCurrency(currency);
  };

  const toggleMax = state => {
    setNavigation(null);
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
          setFromAmount={setFromAmount}
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
        {showDetails && (
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
