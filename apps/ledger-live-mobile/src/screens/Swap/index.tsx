import { useTheme } from "@react-navigation/native";
import React, { useMemo, useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import Config from "react-native-config";
import { checkQuote } from "@ledgerhq/live-common/lib/exchange/swap";
import { Button } from "@ledgerhq/native-ui";
import {
  AvailableProviderV3,
  ExchangeRate,
  SwapTransaction,
  KYCStatus,
  ValidCheckQuoteErrorCodes,
  OnNoRatesCallback,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import {
  usePollKYCStatus,
  useSwapTransaction,
  useProviders,
} from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import {
  getKYCStatusFromCheckQuoteStatus,
  KYC_STATUS,
  shouldShowKYCBanner,
  shouldShowLoginBanner,
} from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { accountsSelector } from "../../reducers/accounts";
import { swapKYCSelector } from "../../reducers/settings";
import { setSwapKYCStatus } from "../../actions/settings";
import { TrackScreen, track } from "../../analytics";
import KeyboardView from "../../components/KeyboardView";
import { Loading, NotAvailable, TxForm } from "./Form";
import { trackSwapError, SWAP_VERSION } from "./utils";
import { SwapProps } from "./types";

export * from "./types";
export * from "./SelectAccount";
export * from "./SelectCurrency";

export const ratesExpirationThreshold = 60000;

enum ActionRequired {
  Login,
  KYC,
  MFA,
  None,
}

export function SwapForm(_props: SwapProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const accounts = useSelector(accountsSelector);
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

  // FIXME: should use enums for Flow and Banner values
  const [currentFlow, setCurrentFlow] = useState();
  const [currentBanner, setCurrentBanner] = useState<ActionRequired>(
    ActionRequired.None,
  );
  const [errorCode, setErrorCode] = useState<
    ValidCheckQuoteErrorCodes | undefined
  >();

  // On provider change, reset banner and flow
  useEffect(() => {
    setCurrentFlow(undefined);
    setCurrentBanner(ActionRequired.None);
    setErrorCode(undefined);
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

    if (shouldShowLoginBanner({ provider, token: kyc?.id })) {
      setCurrentBanner(ActionRequired.Login);
      return;
    }

    if (!kyc) {
      return;
    }

    // we display the KYC banner component if partner requiers KYC and is not yet approved
    // we don't display it if user needs to login first
    if (
      currentBanner !== ActionRequired.Login &&
      shouldShowKYCBanner({ provider, validKycStatus: kyc.status })
    ) {
      setCurrentBanner(ActionRequired.KYC);
    }
  }, [error, provider, kyc, currentBanner]);

  useEffect(() => {
    // Whenever an account is added, reselect the currency to pick a default target account.
    // (possibly the one that got created)
    if (swapTx.swap.to.currency && !swapTx.swap.to.account) {
      swapTx.setToCurrency(swapTx.swap.to.currency);
    }
    // eslint-disable-next-line
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
    if (kyc?.id && currentFlow === "LOGIN") {
      setCurrentFlow(undefined);
    }
  }, [kyc?.id, currentFlow]);

  //   const onContinue = useCallback(() => {
  //     swapTx.setConfirmed(true);
  //   }, [swapTx]);

  //   const onReset = useCallback(() => {
  //     swapTx.setConfirmed(false);
  //   }, [swapTx]);

  useEffect(() => {
    if (
      !kyc?.id ||
      !exchangeRate?.rateId ||
      currentFlow === "KYC" ||
      currentFlow === "MFA"
    ) {
      return;
    }
    async function handleCheckQuote() {
      if (!provider || !exchangeRate?.rateId || !kyc) return;

      const status = await checkQuote({
        provider,
        quoteId: exchangeRate.rateId,
        bearerToken: kyc.id,
      });

      // User needs to complete MFA on partner own UI / dedicated widget
      if (status.codeName === "MFA_REQUIRED") {
        setCurrentBanner(ActionRequired.MFA);
        return;
      }
      // No need to show MFA banner for other cases
      setCurrentBanner(ActionRequired.None);

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
        setCurrentFlow(undefined);

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
  }, [kyc, exchangeRate, dispatch, provider, currentFlow]);

  const isSwapReady =
    !errorCode &&
    !swapTx.bridgePending &&
    exchangeRatesState.status !== "loading" &&
    swapTx.transaction &&
    !error &&
    !swapError &&
    !currentBanner &&
    exchangeRate &&
    swapTx.swap.to.account;

  const onSubmit = () => {
    track("Page Swap Form - Request", {
      sourceCurrency: sourceCurrency?.name,
      targetCurrency: targetCurrency?.name,
      provider,
      swapVersion: SWAP_VERSION,
    });
    /* setDrawer( */
    /*   ExchangeDrawer, */
    /*   { swapTransaction: swapTx, exchangeRate }, */
    /*   { preventBackdropClick: true }, */
    /* ); */
  };

  const sourceAccount = swapTx.swap.from.account;
  const sourceCurrency = swapTx.swap.from.currency;
  const targetCurrency = swapTx.swap.to.currency;

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
      <KeyboardView style={styles.root}>
        <TrackScreen category="Swap Form" providerName={provider} />
        <TxForm swapTx={swapTx} pairs={pairs} />

        <Button type="main" disabled={!isSwapReady} onPress={onSubmit}>
          {t("common.exchange")}
        </Button>
      </KeyboardView>
    );
  }

  if (error) {
    return <NotAvailable />;
  }

  return <Loading />;
  // return swapTx.showDeviceConnect ? (
  //   <Connect provider={provider} setResult={swapTx.setDeviceMeta} />
  // ) : (
  //   <KeyboardView style={[styles.root, { backgroundColor: colors.background }]}>
  //     <TrackScreen category="Swap Form" providerName={provider} />
  //     <View>
  //       <AccountAmountRow
  //         navigation={navigation}
  //         route={route}
  //         swap={swapTx.swap}
  //         transaction={swapTx.transaction}
  //         setFromAccount={swapTx.setFromAccount}
  //         setFromAmount={swapTx.setFromAmount}
  //         setToCurrency={swapTx.setToCurrency}
  //         useAllAmount={swapTx.swap.isMaxEnabled}
  //         rate={swapTx.rate}
  //         bridgePending={swapTx.bridgePending}
  //         fromAmountError={swapError}
  //         providers={swapTx.providers}
  //         provider={provider}
  //       />
  //     </View>
  //     <ScrollView contentContainerStyle={styles.scrollZone}>
  //       <FormSummary
  //         swapTx={swapTx}
  //         kycStatus={kycStatus}
  //         provider={provider}
  //       />
  //       {error && (
  //         <GenericErrorBottomModal
  //           error={error}
  //           isOpened
  //           onClose={swapTx.resetError}
  //         />
  //       )}
  //     </ScrollView>
  //     <View>
  //       <View style={styles.available}>
  //         <View style={styles.availableLeft}>
  //           <LText>
  //             <Trans i18nKey="transfer.swap.form.amount.available" />
  //           </LText>
  //           <LText semiBold>
  //             {swapTx.maxSpendable ? (
  //               <CurrencyUnitValue
  //                 showCode
  //                 unit={swapTx.fromUnit}
  //                 value={swapTx.maxSpendable}
  //               />
  //             ) : (
  //               "-"
  //             )}
  //           </LText>
  //         </View>
  //         {swapTx.maxSpendable ? (
  //           <View style={styles.availableRight}>
  //             <LText style={styles.maxLabel}>
  //               <Trans i18nKey="transfer.swap.form.amount.useMax" />
  //             </LText>
  //             <Switch
  //               style={styles.switch}
  //               value={swapTx.swap.isMaxEnabled}
  //               onValueChange={value => {
  //                 Keyboard.dismiss();
  //                 swapTx.toggleMax(value);
  //               }}
  //             />
  //           </View>
  //         ) : null}
  //       </View>
  //       <View style={styles.buttonContainer}>
  //         <Button
  //           containerStyle={styles.button}
  //           event="Page Swap Form - CTA"
  //           eventProperties={{
  //             provider,
  //             targetCurrency: swapTx.swap?.to?.currency?.id,
  //             sourceCurrency: swapTx.swap?.from?.currency?.id,
  //           }}
  //           type="primary"
  //           disabled={!swapTx.isSwapReady}
  //           title={<Trans i18nKey="transfer.swap.form.tab" />}
  //           onPress={onContinue}
  //         />
  //       </View>
  //       {swapTx.confirmed ? (
  //         swapTx.alreadyAcceptedTerms && swapTx.deviceMeta ? (
  //           <>
  //             <Track
  //               onUpdate
  //               event={"Swap Form - AcceptedSummaryDisclaimer"}
  //               provider={provider}
  //             />
  //             <Confirmation
  //               swap={swapTx.swap}
  //               rate={swapTx.rate}
  //               status={swapTx.status}
  //               transaction={swapTx.transaction}
  //               deviceMeta={swapTx.deviceMeta}
  //               provider={swapTx.provider}
  //               onError={e => {
  //                 onReset();
  //                 setError(e);
  //               }}
  //               onCancel={onReset}
  //             />
  //           </>
  //         ) : !swapTx.alreadyAcceptedTerms ? (
  //           <DisclaimerModal
  //             provider={swapTx.provider}
  //             onContinue={() => {
  //               dispatch(swapAcceptProvider(swapTx.provider));
  //               swapTx.setConfirmed(true);
  //             }}
  //             onClose={() => swapTx.setConfirmed(false)}
  //           />
  //         ) : null
  //       ) : null}
  //     </View>
  //   </KeyboardView>
  // );
}

const trackNoRates: OnNoRatesCallback = ({ toState }) => {
  track("Page Swap Form - Error No Rate", {
    sourceCurrency: toState.currency?.name,
  });
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  scrollZone: {
    flex: 1,
  },
  button: {
    flex: 1,
  },
  buttonContainer: {
    paddingTop: 24,
    flexDirection: "row",
  },
  available: {
    flexDirection: "row",
    display: "flex",
    flexGrow: 1,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  availableLeft: {
    justifyContent: "center",
    flexGrow: 1,
  },
  maxLabel: {
    marginRight: 4,
  },
  switch: {
    opacity: 0.99,
  },
});
