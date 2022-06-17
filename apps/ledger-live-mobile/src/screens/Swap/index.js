// @flow
import { useTheme } from "@react-navigation/native";
import React, { useMemo, useCallback, useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Keyboard } from "react-native";
import type {
  CryptoCurrency,
  TokenCurrency,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import type {
  Account,
  AccountLike,
  TokenAccount,
} from "@ledgerhq/live-common/lib/types/account";
import { checkQuote } from "@ledgerhq/live-common/lib/exchange/swap";
import type {
  ExchangeRate,
  SwapTransaction,
  AvailableProviderV3,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import type { SwapDataType } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import {
  usePollKYCStatus,
  useSwapTransaction,
} from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import {
  CurrenciesStatus,
  getSupportedCurrencies,
} from "@ledgerhq/live-common/lib/exchange/swap/logic";
import {
  getKYCStatusFromCheckQuoteStatus,
  KYC_STATUS,
  shouldShowKYCBanner,
  shouldShowLoginBanner,
} from "@ledgerhq/live-common/lib/exchange/swap/utils";
import { Trans } from "react-i18next";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";
import { useDispatch, useSelector } from "react-redux";
import AccountAmountRow from "./FormSelection/AccountAmountRow";
import Button from "../../components/Button";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Switch from "../../components/Switch";
import { accountsSelector } from "../../reducers/accounts";
import { NavigatorName } from "../../const";
import KeyboardView from "../../components/KeyboardView";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import Info from "../../icons/Info";
import RatesSection from "./FormSelection/RatesSection";
import { swapKYCSelector } from "../../reducers/settings";
import Confirmation from "./Confirmation";
import { swapAcceptProvider, setSwapKYCStatus } from "../../actions/settings";
import {
  rateSelector,
  updateRateAction,
  updateTransactionAction,
} from "../../actions/swap";
import Connect from "./Connect";
import { Track, TrackScreen, track } from "../../analytics";
import DisclaimerModal from "./DisclaimerModal";
import { trackSwapError, SWAP_VERSION } from "./utils";

export type SwapRouteParams = {
  swap: SwapDataType,
  exchangeRate: ExchangeRate,
  currenciesStatus: CurrenciesStatus,
  selectableCurrencies: (CryptoCurrency | TokenCurrency)[],
  transaction?: SwapTransaction,
  status?: TransactionStatus,
  selectedCurrency: CryptoCurrency | TokenCurrency,
  providers?: AvailableProviderV3[] | null,
  provider: string,
  installedApps: any,
  target: "from" | "to",
  rateExpiration?: Date,
  rate?: ExchangeRate,
  rates?: ExchangeRate[],
  tradeMethod?: string,
  setAccount?: (account?: Account | TokenAccount) => void,
  setCurrency?: (currency?: TokenCurrency | CryptoCurrency) => void,
};

export const ratesExpirationThreshold = 60000;

type Props = {
  route: { params: SwapRouteParams },
  navigation: *,
  providers: AvailableProviderV3[],
  provider: string,
  providersError: ?Error,
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
};

// Check if any account is available
// if yes -> Render SwapForm
// no -> inform in modal
export default function SwapFormEntry(props: Props) {
  const { colors } = useTheme();
  const {
    route,
    navigation,
    defaultAccount: initDefaultAccount,
    providers,
    provider: initProvider,
  } = props;
  const provider = route?.params?.provider || initProvider;
  const accounts = useSelector(accountsSelector);

  const enhancedAccounts = useMemo(
    () => accounts.map(acc => accountWithMandatoryTokens(acc, [])),
    [accounts],
  );

  const allAccounts = flattenAccounts(enhancedAccounts);

  const selectableCurrencies = getSupportedCurrencies({ providers, provider });

  const elligibleAccountsForSelectedCurrency = allAccounts.filter(
    account =>
      account.balance.gt(0) &&
      selectableCurrencies.some(c => c === getAccountCurrency(account)),
  );

  const defaultAccount =
    initDefaultAccount || elligibleAccountsForSelectedCurrency[0];

  const [noAssetModalOpen, setNoAssetModalOpen] = useState(!defaultAccount);

  const onNavigateToBuyCrypto = useCallback(() => {
    setNoAssetModalOpen(false);
    navigation.replace(NavigatorName.ExchangeBuyFlow);
  }, [navigation]);

  const onNavigateBack = useCallback(() => {
    setNoAssetModalOpen(false);
    navigation.goBack();
  }, [navigation]);

  return defaultAccount ? (
    <SwapForm {...props} defaultAccount={defaultAccount} />
  ) : (
    <ConfirmationModal
      isOpened={noAssetModalOpen}
      onClose={onNavigateBack}
      confirmationTitle={<Trans i18nKey="transfer.swap.form.noAsset.title" />}
      confirmationDesc={<Trans i18nKey="transfer.swap.form.noAsset.desc" />}
      confirmButtonText={<Trans i18nKey="carousel.banners.buyCrypto.title" />}
      onConfirm={onNavigateToBuyCrypto}
      Icon={Info}
      iconMarginBottom={16}
      iconColor={colors.orange}
    />
  );
}

function SwapForm({ route, navigation, providersError }: Props) {
  const { colors } = useTheme();
  const accounts = useSelector(accountsSelector);
  const dispatch = useDispatch();

  const exchangeRate = useSelector(rateSelector);
  const setExchangeRate = useCallback(
    rate => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );
  const swapTx = useSwapTransaction({
    accounts,
    exchangeRate,
    setExchangeRate,
    onNoRates: trackNoRates,
    // ...locationState,
  });

  const exchangeRatesState = swapTx.swap?.rates;
  const swapKYC = useSelector(swapKYCSelector);
  const provider = exchangeRate?.provider;
  const providerKYC = swapKYC?.[provider];
  const kycStatus = providerKYC?.status;

  // FIXME: should use enums for Flow and Banner values
  const [currentFlow, setCurrentFlow] = useState();
  const [currentBanner, setCurrentBanner] = useState();
  const [error, setError] = useState();

  // On provider change, reset banner and flow
  useEffect(() => {
    setCurrentFlow();
    setCurrentBanner();
    setError();
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
    if (
      currentBanner !== "LOGIN" &&
      shouldShowKYCBanner({ provider, kycStatus })
    ) {
      setCurrentBanner("KYC");
    }
  }, [error, provider, providerKYC?.id, kycStatus, currentBanner]);

  useEffect(() => {
    dispatch(updateTransactionAction(swapTx.transaction));
    // eslint-disable-next-line
  }, [swapTx.transaction]);

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
      kyc: providerKYC,
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
    if (providerKYC?.id && currentFlow === "LOGIN") {
      setCurrentFlow(null);
    }
  }, [providerKYC?.id, currentFlow]);

  const onContinue = useCallback(() => {
    swapTx.setConfirmed(true);
  }, [swapTx]);

  const onReset = useCallback(() => {
    swapTx.setConfirmed(false);
  }, [swapTx]);

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
      }
      // No need to show MFA banner for other cases
      setCurrentBanner(null);

      if (typeof provider === "undefined") {
        return;
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

      // All other statuses are considered errors
      setError(status.codeName);
    };

    handleCheckQuote();
  }, [providerKYC, exchangeRate, dispatch, provider, kycStatus, currentFlow]);

  const isSwapReady =
    !error &&
    !swapTx.bridgePending &&
    exchangeRatesState.status !== "loading" &&
    swapTx.transaction &&
    !providersError &&
    !swapTx.swapError &&
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

  return swapTx.showDeviceConnect ? (
    <Connect provider={provider} setResult={swapTx.setDeviceMeta} />
  ) : (
    <KeyboardView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="Swap Form" providerName={provider} />
      <View>
        <AccountAmountRow
          navigation={navigation}
          route={route}
          swap={swapTx.swap}
          transaction={swapTx.transaction}
          setFromAccount={swapTx.setFromAccount}
          setFromAmount={swapTx.setFromAmount}
          setToCurrency={swapTx.setToCurrency}
          useAllAmount={swapTx.swap.isMaxEnabled}
          rate={swapTx.rate}
          bridgePending={swapTx.bridgePending}
          fromAmountError={swapError}
          providers={swapTx.providers}
          provider={provider}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scrollZone}>
        <RatesSection
          navigation={navigation}
          route={route}
          swap={swapTx.swap}
          transaction={swapTx.transaction}
          status={swapTx.status}
          rate={swapTx.rate}
          setToAccount={swapTx.setToAccount}
          accounts={accounts}
          providers={swapTx.providers}
          provider={provider}
        />
        {error && (
          <GenericErrorBottomModal
            error={error}
            isOpened
            onClose={swapTx.resetError}
          />
        )}
      </ScrollView>
      <View>
        <View style={styles.available}>
          <View style={styles.availableLeft}>
            <LText>
              <Trans i18nKey="transfer.swap.form.amount.available" />
            </LText>
            <LText semiBold>
              {swapTx.maxSpendable ? (
                <CurrencyUnitValue
                  showCode
                  unit={swapTx.fromUnit}
                  value={swapTx.maxSpendable}
                />
              ) : (
                "-"
              )}
            </LText>
          </View>
          {swapTx.maxSpendable ? (
            <View style={styles.availableRight}>
              <LText style={styles.maxLabel}>
                <Trans i18nKey="transfer.swap.form.amount.useMax" />
              </LText>
              <Switch
                style={styles.switch}
                value={swapTx.swap.isMaxEnabled}
                onValueChange={value => {
                  Keyboard.dismiss();
                  swapTx.toggleMax(value);
                }}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.buttonContainer}>
          <Button
            containerStyle={styles.button}
            event="Page Swap Form - CTA"
            eventProperties={{
              provider,
              targetCurrency: swapTx.swap?.to?.currency?.id,
              sourceCurrency: swapTx.swap?.from?.currency?.id,
            }}
            type="primary"
            disabled={!swapTx.isSwapReady}
            title={<Trans i18nKey="transfer.swap.form.tab" />}
            onPress={onContinue}
          />
        </View>
        {swapTx.confirmed ? (
          swapTx.alreadyAcceptedTerms && swapTx.deviceMeta ? (
            <>
              <Track
                onUpdate
                event={"Swap Form - AcceptedSummaryDisclaimer"}
                provider={provider}
              />
              <Confirmation
                swap={swapTx.swap}
                rate={swapTx.rate}
                status={swapTx.status}
                transaction={swapTx.transaction}
                deviceMeta={swapTx.deviceMeta}
                provider={swapTx.provider}
                onError={e => {
                  onReset();
                  setError(e);
                }}
                onCancel={onReset}
              />
            </>
          ) : !swapTx.alreadyAcceptedTerms ? (
            <DisclaimerModal
              provider={swapTx.provider}
              onContinue={() => {
                dispatch(swapAcceptProvider(swapTx.provider));
                swapTx.setConfirmed(true);
              }}
              onClose={() => swapTx.setConfirmed(false)}
            />
          ) : null
        ) : null}
      </View>
    </KeyboardView>
  );
}

function trackNoRates({ toState }) {
  track("Page Swap Form - Error No Rate", {
    sourceCurrency: toState.currency?.name,
  });
}

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
