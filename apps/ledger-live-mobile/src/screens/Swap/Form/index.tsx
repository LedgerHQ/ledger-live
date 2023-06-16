import React, { useState, useEffect, useCallback } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { checkQuote } from "@ledgerhq/live-common/exchange/swap/index";
import { Button, Flex } from "@ledgerhq/native-ui";
import {
  OnNoRatesCallback,
  ActionRequired,
  ValidCheckQuoteErrorCodes,
  ValidKYCStatus,
} from "@ledgerhq/live-common/exchange/swap/types";
import {
  usePollKYCStatus,
  useSwapTransaction,
  useSwapProviders,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  getKYCStatusFromCheckQuoteStatus,
  KYC_STATUS,
  shouldShowKYCBanner,
  shouldShowLoginBanner,
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  flattenAccounts,
  accountWithMandatoryTokens,
  getParentAccount,
  isTokenAccount,
} from "@ledgerhq/live-common/account/index";
import { getSwapSelectableCurrencies } from "@ledgerhq/live-common/exchange/swap/logic";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import { shallowAccountsSelector } from "../../../reducers/accounts";
import { swapAcceptedProvidersSelector, swapKYCSelector } from "../../../reducers/settings";
import { setSwapKYCStatus, setSwapSelectableCurrencies } from "../../../actions/settings";
import {
  providersSelector,
  rateSelector,
  resetSwapAction,
  updateProvidersAction,
  updateRateAction,
  updateTransactionAction,
} from "../../../actions/swap";
import { TrackScreen, useAnalytics } from "../../../analytics";
import { Loading } from "../Loading";
import { NotAvailable } from "./NotAvailable";
import { TxForm } from "./TxForm";
import { Summary } from "./Summary";
import { Requirement } from "./Requirement";
import { sharedSwapTracking, useTrackSwapError } from "../utils";
import { Max } from "./Max";
import { Modal } from "./Modal";
import { Connect } from "./Connect";
import { DeviceMeta } from "./Modal/Confirmation";
import { ErrorBanner } from "./ErrorBanner";
import { MaterialTopTabNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../const";
import { SwapFormNavigatorParamList } from "../../../components/RootNavigator/types/SwapFormNavigator";

export const useProviders = () => {
  const dispatch = useDispatch();
  const storedProviders = useSelector(providersSelector);
  const { providers, error: providersError } = useSwapProviders();

  useEffect(() => {
    if (providers) {
      dispatch(updateProvidersAction(providers));
      dispatch(setSwapSelectableCurrencies(getSwapSelectableCurrencies(providers)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  useEffect(() => {
    if (providersError) dispatch(resetSwapAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersError]);

  return {
    providers: storedProviders,
    providersError,
  };
};

export function SwapForm({
  route: { params },
}: MaterialTopTabNavigatorProps<SwapFormNavigatorParamList, ScreenName.SwapForm>) {
  const { track } = useAnalytics();
  const trackSwapError = useTrackSwapError();
  const [currentFlow, setCurrentFlow] = useState<ActionRequired>(ActionRequired.None);
  const [currentBanner, setCurrentBanner] = useState<ActionRequired>(ActionRequired.None);

  const [error, setError] = useState<ValidCheckQuoteErrorCodes>();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accounts = useSelector(shallowAccountsSelector);
  const { providers, providersError } = useProviders();
  const exchangeRate = useSelector(rateSelector);
  const setExchangeRate = useCallback(
    rate => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );
  const onNoRates: OnNoRatesCallback = useCallback(
    ({ toState }) => {
      track("error_message", {
        ...sharedSwapTracking,
        message: "no_rates",
        sourceCurrency: toState.currency?.name,
      });
    },
    [track],
  );
  const swapTransaction = useSwapTransaction({
    accounts,
    setExchangeRate,
    onNoRates,
    excludeFixedRates: true,
    providers,
    includeDEX: false,
  });

  const exchangeRatesState = swapTransaction.swap?.rates;
  const swapKYC = useSelector(swapKYCSelector);
  const provider = exchangeRate?.provider;
  const providerKYC = provider ? swapKYC?.[provider] : undefined;
  const kycStatus = providerKYC?.status as ValidKYCStatus | "rejected";

  // On provider change, reset banner and flow
  useEffect(() => {
    setCurrentBanner(ActionRequired.None);
    setCurrentFlow(ActionRequired.None);
    setError(undefined);
  }, [provider]);

  useEffect(() => {
    // In case of error, don't show  login, kyc or mfa banner
    if (error) {
      // Don't show any flow banner on error to avoid double banner display
      setCurrentBanner(ActionRequired.None);
      return;
    }

    // Don't display login nor kyc banner if user needs to complete MFA
    if (currentBanner === ActionRequired.MFA) {
      return;
    }

    if (shouldShowLoginBanner({ provider, token: providerKYC?.id })) {
      setCurrentBanner(ActionRequired.Login);
      return;
    }

    // we display the KYC banner component if partner requiers KYC and is not yet approved
    // we don't display it if user needs to login first
    if (currentBanner !== ActionRequired.Login && shouldShowKYCBanner({ provider, kycStatus })) {
      setCurrentBanner(ActionRequired.KYC);
    }
  }, [error, provider, providerKYC?.id, kycStatus, currentBanner]);

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

  // TODO: update usePollKYCStatus to use checkQuote for KYC status (?)
  usePollKYCStatus(
    {
      provider,
      kyc: providerKYC,
      onChange: res => {
        dispatch(
          setSwapKYCStatus({
            provider,
            id: res?.id,
            status: res?.status,
          }),
        );
      },
    },
    [dispatch],
  );
  const swapError = swapTransaction.fromAmountError || exchangeRatesState?.error;

  // Track errors
  useEffect(
    () => {
      if (swapError) {
        trackSwapError(swapError, {
          sourcecurrency: swapTransaction.swap.from.currency?.name,
          provider,
        });
        // eslint-disable-next-line no-console
        console.log("Swap Error", swapError);
        log("swap", "failed to fetch swaps", swapError);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swapError],
  );

  // close login widget once we get a bearer token (i.e: the user is logged in)
  useEffect(() => {
    if (providerKYC?.id && currentFlow === ActionRequired.Login) {
      setCurrentFlow(ActionRequired.None);
    }
  }, [providerKYC?.id, currentFlow]);

  /**
   * TODO
   * Too complicated, seems to handle to much things (KYC status + non KYC related errors)
   * KYC related stuff should be handled in usePollKYCStatus
   */
  useEffect(() => {
    if (
      !provider ||
      !providerKYC?.id ||
      exchangeRate.tradeMethod === "float" ||
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
        setCurrentBanner(ActionRequired.MFA);
        return;
      }
      // No need to show MFA banner for other cases
      setCurrentBanner(ActionRequired.None);

      if (status.codeName === "RATE_VALID") {
        // If trade can be done and KYC already approved, we are good
        // PS: this can't be checked before the `checkQuote` call since a KYC status can become expierd
        if (kycStatus === KYC_STATUS.approved) {
          return;
        }

        // If status is ok, close login, kyc and mfa widgets even if open
        setCurrentFlow(ActionRequired.None);

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
    currentBanner === ActionRequired.None &&
    exchangeRate &&
    swapTransaction.swap.to.account;

  const onSubmit = useCallback(() => {
    track(
      "button_clicked",
      {
        ...sharedSwapTracking,
        sourceCurrency: swapTransaction.swap.from.currency?.name,
        targetCurrency: swapTransaction.swap.to.currency?.name,
        provider,
        button: "exchange",
      },
      undefined,
    );
    setConfirmed(true);
  }, [swapTransaction, provider, track]);

  const onCloseModal = useCallback(() => {
    setConfirmed(false);
  }, []);

  // mobile specific
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    if (params?.currency) {
      swapTransaction.setToCurrency(params.currency);
    }

    if (params?.accountId) {
      const enhancedAccounts =
        params.target === "from"
          ? accounts
          : accounts.map(acc =>
              accountWithMandatoryTokens(acc, [(params?.currency as TokenCurrency) || []]),
            );

      const account = flattenAccounts(enhancedAccounts).find(a => a.id === params.accountId);

      if (params.target === "from") {
        track(
          "Page Swap Form - New Source Account",
          {
            ...sharedSwapTracking,
            provider,
          },
          undefined,
        );
        swapTransaction.setFromAccount(account);
      }

      if (params.target === "to") {
        swapTransaction.setToAccount(
          swapTransaction.swap.to.currency,
          account,
          isTokenAccount(account) ? getParentAccount(account, accounts) : undefined,
        );
      }
    }

    if (params?.rate) {
      setExchangeRate(params.rate);
    }

    if (params?.transaction) {
      swapTransaction.setTransaction(params.transaction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const swapAcceptedProviders = useSelector(swapAcceptedProvidersSelector);
  const termsAccepted = (swapAcceptedProviders || []).includes(provider ?? "");
  const [deviceMeta, setDeviceMeta] = useState<DeviceMeta>();

  const isFtx = ["ftx", "ftxus"].includes(provider || "");

  if (confirmed && !deviceMeta && (isFtx || termsAccepted)) {
    return <Connect provider={provider} setResult={setDeviceMeta} />;
  }

  if (providers?.length) {
    return (
      <KeyboardAwareScrollView>
        <Flex flex={1} justifyContent="space-between" padding={6}>
          <Flex flex={1}>
            <TrackScreen category="Swap" providerName={provider} {...sharedSwapTracking} />
            <TxForm
              swapTx={swapTransaction}
              provider={provider}
              exchangeRate={exchangeRate}
              swapError={swapError}
              isSendMaxLoading={swapTransaction.swap.isMaxLoading}
            />

            {swapTransaction.swap.rates.status === "loading" ? (
              <Flex height={200}>
                <Loading size={20} color="neutral.c70" />
              </Flex>
            ) : (
              <>
                {exchangeRate &&
                  swapTransaction.swap.to.currency &&
                  swapTransaction.swap.from.currency && (
                    <Summary provider={provider} swapTx={swapTransaction} kyc={kycStatus} />
                  )}

                <Requirement required={currentBanner} provider={provider} />

                {error && provider && <ErrorBanner provider={provider} errorCode={error} />}
              </>
            )}
          </Flex>

          <Flex paddingY={4}>
            <Max swapTx={swapTransaction} />

            <Button type="main" disabled={!isSwapReady} onPress={onSubmit}>
              {t("transfer.swap2.form.cta")}
            </Button>
          </Flex>
        </Flex>

        <Modal
          swapTx={swapTransaction}
          confirmed={confirmed}
          termsAccepted={termsAccepted}
          onClose={onCloseModal}
          deviceMeta={deviceMeta}
          exchangeRate={exchangeRate}
        />
      </KeyboardAwareScrollView>
    );
  }

  if (providers?.length === 0 || providersError) {
    return <NotAvailable />;
  }

  return <Loading />;
}
