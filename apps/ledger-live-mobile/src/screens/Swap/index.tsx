import React, { useMemo, useState, useEffect, useCallback } from "react";
import { KeyboardAvoidingView, ScrollView } from "react-native";
import Config from "react-native-config";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { checkQuote } from "@ledgerhq/live-common/lib/exchange/swap";
import { Button, Flex } from "@ledgerhq/native-ui";
import {
  AvailableProviderV3,
  ExchangeRate,
  SwapTransaction,
  KYCStatus,
  ValidCheckQuoteErrorCodes,
  OnNoRatesCallback,
  ActionRequired,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import {
  usePollKYCStatus,
  useSwapTransaction,
  useProviders,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import {
  getKYCStatusFromCheckQuoteStatus,
  KYC_STATUS,
  shouldShowKYCBanner,
  shouldShowLoginBanner,
} from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { shallowAccountsSelector } from "../../reducers/accounts";
import { swapKYCSelector } from "../../reducers/settings";
import { setSwapKYCStatus } from "../../actions/settings";
import { TrackScreen, track } from "../../analytics";
import { Loading, NotAvailable, TxForm, Summary, Requirement } from "./Form";
import { trackSwapError, SWAP_VERSION } from "./utils";
import { SwapFormProps } from "./types";

export * from "./types";
export * from "./SelectAccount";
export * from "./SelectCurrency";
export * from "./Widget";

export const ratesExpirationThreshold = 60000;

export function SwapForm({ route: { params } }: SwapFormProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const accounts = useSelector(shallowAccountsSelector);
  const { providers, error, pairs } = useProviders(
    Config.SWAP_DISABLED_PROVIDERS,
  );

  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | undefined>();
  const swapTx = useSwapTransaction({
    accounts,
    setExchangeRate,
    onNoRates: trackNoRates,
  });

  const exchangeRatesState = swapTx.swap?.rates;
  const swapKYC = useSelector(swapKYCSelector);

  const currencyNames = useMemo(() => {
    if (!swapTx.swap.from.currency) {
      return pairs.map(p => p.to);
    }

    return pairs.reduce<string[]>(
      (acc, p) =>
        p.from === swapTx.swap.from.currency?.id ? [...acc, p.to] : acc,
      [],
    );
  }, [pairs, swapTx.swap.from.currency]);

  const currencies = useSelectableCurrencies({
    allCurrencies: [...new Set(currencyNames)],
  });

  const { provider, kyc } = useMemo<{
    provider?: string;
    kyc?: KYCStatus;
  }>(() => {
    const provider = exchangeRate?.provider;

    if (!provider || !swapKYC) {
      return { exchangeRate, provider };
    }

    return {
      provider,
      exchangeRate,
      kyc: swapKYC[provider],
    };
  }, [exchangeRate, swapKYC]);

  const [actionRequired, setActionRequired] = useState<ActionRequired>(
    ActionRequired.None,
  );
  const [errorCode, setErrorCode] = useState<
    ValidCheckQuoteErrorCodes | undefined
  >();

  useEffect(() => {
    if (params?.currency) {
      swapTx.setToCurrency(params.currency);
    }

    if (params?.account) {
      swapTx.setFromAccount(params.account);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // On provider change, reset banner and flow
  useEffect(() => {
    setActionRequired(ActionRequired.None);
    setErrorCode(undefined);
  }, [provider]);

  useEffect(() => {
    // In case of error, don't show  login, kyc or mfa banner
    if (error) {
      // Don't show any flow banner on error to avoid double banner display
      setActionRequired(ActionRequired.None);
      return;
    }

    // Don't display login nor kyc banner if user needs to complete MFA
    if (actionRequired === ActionRequired.MFA) {
      return;
    }

    if (shouldShowLoginBanner({ provider, token: kyc?.id })) {
      setActionRequired(ActionRequired.Login);
      return;
    }

    if (!kyc) {
      return;
    }

    // we display the KYC banner component if partner requiers KYC and is not yet approved
    // we don't display it if user needs to login first
    if (
      actionRequired !== ActionRequired.Login &&
      shouldShowKYCBanner({ provider, validKycStatus: kyc.status })
    ) {
      setActionRequired(ActionRequired.KYC);
    }
  }, [error, provider, kyc, actionRequired]);

  useEffect(() => {
    // Whenever an account is added, reselect the currency to pick a default target account.
    // (possibly the one that got created)
    if (swapTx.swap.to.currency && !swapTx.swap.to.account) {
      swapTx.setToCurrency(swapTx.swap.to.currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  // FIXME: update usePollKYCStatus to use checkQuote for KYC status (?)
  usePollKYCStatus(
    {
      provider,
      kyc,
      onChange: res => {
        if (!provider) return;
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
  const swapError = swapTx.fromAmountError || exchangeRatesState?.error;

  // Track errors
  useEffect(
    () => {
      swapError &&
        trackSwapError(swapError, {
          sourcecurrency: swapTx.swap.from.currency?.name,
          provider,
          swapVersion: SWAP_VERSION,
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swapError],
  );

  // close login widget once we get a bearer token (i.e: the user is logged in)
  useEffect(() => {
    if (kyc?.id && actionRequired === ActionRequired.Login) {
      setActionRequired(ActionRequired.None);
    }
  }, [kyc?.id, actionRequired]);

  useEffect(() => {
    if (
      !kyc?.id ||
      !exchangeRate?.rateId ||
      actionRequired === ActionRequired.KYC ||
      actionRequired === ActionRequired.MFA
    ) {
      return;
    }

    async function handleCheckQuote() {
      const status = await checkQuote({
        provider,
        quoteId: exchangeRate.rateId,
        bearerToken: kyc.id,
      });

      // User needs to complete MFA on partner own UI / dedicated widget
      if (status.codeName === "MFA_REQUIRED") {
        setActionRequired(ActionRequired.MFA);
        return;
      }
      // No need to show MFA banner for other cases
      setActionRequired(ActionRequired.None);

      if (typeof provider === "undefined") {
        return;
      }

      if (status.codeName === "RATE_VALID") {
        // If trade can be done and KYC already approved, we are good
        // PS: this can't be checked before the `checkQuote` call since a KYC status can become expierd
        if (kyc.status === KYC_STATUS.approved) {
          return;
        }

        // If status is ok, close login, kyc and mfa widgets even if open
        setActionRequired(ActionRequired.None);

        dispatch(
          setSwapKYCStatus({
            provider,
            id: kyc.id,
            status: KYC_STATUS.approved,
          }),
        );
        return;
      }

      // Handle all KYC related errors
      if (status.codeName.startsWith("KYC_")) {
        const updatedKycStatus = getKYCStatusFromCheckQuoteStatus(status);
        if (!updatedKycStatus) return;

        if (updatedKycStatus !== kyc.status) {
          dispatch(
            setSwapKYCStatus({
              provider,
              id: kyc.id,
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

      // All other statuses are considered errors
      setErrorCode(status.codeName);
    }

    handleCheckQuote();
  }, [kyc, exchangeRate, dispatch, provider, actionRequired]);

  const isSwapReady =
    !errorCode &&
    !swapTx.bridgePending &&
    exchangeRatesState.status !== "loading" &&
    swapTx.transaction &&
    !error &&
    !swapError &&
    actionRequired === ActionRequired.None &&
    exchangeRate &&
    swapTx.swap.to.account;

  const onSubmit = useCallback(() => {
    track("Page Swap Form - Request", {
      sourceCurrency: swapTx.swap.from.currency?.name,
      targetCurrency: swapTx.swap.to.currency?.name,
      provider,
      swapVersion: SWAP_VERSION,
    });
    /* setDrawer( */
    /*   ExchangeDrawer, */
    /*   { swapTransaction: swapTx, exchangeRate }, */
    /*   { preventBackdropClick: true }, */
    /* ); */
  }, [swapTx, provider]);

  //   const onContinue = useCallback(() => {
  //     swapTx.setConfirmed(true);
  //   }, [swapTx]);

  //   const onReset = useCallback(() => {
  //     swapTx.setConfirmed(false);
  //   }, [swapTx]);

  /* switch (currentFlow) { */
  /*  case "LOGIN": */
  /*    return <Login provider={provider} onClose={() => setCurrentFlow(null)} />; */

  /*  case "KYC": */
  /*    return ( */
  /*      <KYC */
  /*        provider={provider} */
  /*        onClose={() => { */
  /*          setCurrentFlow(null); */
  /*          /** */
  /*           * Need to reset current banner in order to not display a KYC */
  /*           * banner after completion of Wyre KYC */
  /*           */
  /*          setCurrentBanner(null); */
  /*        }} */
  /*      /> */
  /*    ); */

  /*  case "MFA": */
  /*    return <MFA provider={provider} onClose={() => setCurrentFlow(null)} />; */

  /*  default: */
  /*    break; */
  /* } */

  if (providers) {
    return (
      <KeyboardAwareScrollView>
        <Flex flex={1} justifyContent="space-between" padding={6}>
          <Flex flex={1}>
            <TrackScreen category="Swap Form" providerName={provider} />
            <TxForm
              swapTx={swapTx}
              provider={provider}
              accounts={accounts}
              currencies={currencies}
              exchangeRate={exchangeRate}
            />

            <ScrollView>
              <Summary
                provider={provider}
                swapTx={swapTx}
                exchangeRate={exchangeRate}
                kyc={kyc}
              />

              <Requirement
                actionRequired={actionRequired}
                provider={provider}
              />
            </ScrollView>
          </Flex>

          <Flex paddingY={4}>
            <Button type="main" disabled={!isSwapReady} onPress={onSubmit}>
              {t("common.exchange")}
            </Button>
          </Flex>
        </Flex>
      </KeyboardAwareScrollView>
    );
  }

  if (error) {
    return <NotAvailable />;
  }

  return <Loading />;
}

const trackNoRates: OnNoRatesCallback = ({ toState }) => {
  track("Page Swap Form - Error No Rate", {
    sourceCurrency: toState.currency?.name,
  });
};
