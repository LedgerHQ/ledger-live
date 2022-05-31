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

import type {
  ExchangeRate,
  SwapTransaction,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import type { SwapDataType } from "@ledgerhq/live-common/lib/exchange/swap/hooks";

import { useSwapTransaction } from "@ledgerhq/live-common/lib/exchange/swap/hooks";

import {
  CurrenciesStatus,
  getSupportedCurrencies,
} from "@ledgerhq/live-common/lib/exchange/swap/logic";

import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  accountWithMandatoryTokens,
  flattenAccounts,
  getAccountCurrency,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { useDispatch, useSelector } from "react-redux";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/lib/currencies";
import AccountAmountRow from "./FormSelection/AccountAmountRow";
import Button from "../../components/Button";
import LText from "../../components/LText";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Switch from "../../components/Switch";
import { accountsSelector } from "../../reducers/accounts";

import { NavigatorName, ScreenName } from "../../const";
import KeyboardView from "../../components/KeyboardView";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import Info from "../../icons/Info";
import RatesSection from "./FormSelection/RatesSection";
import { swapAcceptedProvidersSelector } from "../../reducers/settings";
import Confirmation from "./Confirmation";
import { swapAcceptProvider } from "../../actions/settings";
import Connect from "./Connect";
import { Track, TrackScreen } from "../../analytics";
import DisclaimerModal from "./DisclaimerModal";

export type SwapRouteParams = {
  swap: SwapDataType,
  exchangeRate: ExchangeRate,
  currenciesStatus: CurrenciesStatus,
  selectableCurrencies: (CryptoCurrency | TokenCurrency)[],
  transaction?: SwapTransaction,
  status?: TransactionStatus,
  selectedCurrency: CryptoCurrency | TokenCurrency,
  providers: any,
  provider: any,
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
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
  providers: any,
  provider: any,
};

function SwapForm({
  route,
  navigation,
  defaultAccount,
  providers,
  provider,
}: Props) {
  const { colors } = useTheme();
  const accounts = useSelector(accountsSelector);

  const [rate, setRate] = useState(null);

  const selectableCurrencies = getSupportedCurrencies({ providers, provider });

  const maybeFilteredCurrencies = defaultAccount?.balance.gt(0)
    ? selectableCurrencies.filter(c => c !== getAccountCurrency(defaultAccount))
    : selectableCurrencies;

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(
    maybeFilteredCurrencies,
  );

  const defaultCurrency = route?.params?.swap?.from.account
    ? sortedCryptoCurrencies.find(
        c => c !== getAccountCurrency(route?.params?.swap?.from.account),
      )
    : sortedCryptoCurrencies.find(
        c =>
          !defaultAccount ||
          !defaultAccount ||
          c !== getAccountCurrency(defaultAccount),
      );

  useEffect(() => {
    if (route.params?.rate) {
      setRate(route.params.rate);
    }
  }, [route.params?.rate]);

  const {
    status,
    transaction,
    setTransaction,
    bridgePending,
    swap,
    setFromAccount,
    setToAccount,
    setFromAmount,
    setToCurrency,
    toggleMax,
    fromAmountError,
  } = useSwapTransaction({
    accounts,
    exchangeRate: rate,
    setExchangeRate: setRate,
  });

  const swapAcceptedproviders = useSelector(swapAcceptedProvidersSelector);
  const alreadyAcceptedTerms = (swapAcceptedproviders || []).includes(provider);

  const dispatch = useDispatch();
  const [confirmed, setConfirmed] = useState(false);
  const [deviceMeta, setDeviceMeta] = useState();
  const showDeviceConnect = confirmed && alreadyAcceptedTerms && !deviceMeta;

  useEffect(() => {
    if (
      !!defaultCurrency &&
      (!swap.to?.currency || swap.to.currency.id === swap?.from?.currency?.id)
    ) {
      setToCurrency(defaultCurrency);
    }
  }, [defaultCurrency, swap.to, swap.from, setToCurrency]);

  useEffect(() => {
    if (!!defaultAccount && !swap.from?.account) {
      setFromAccount(defaultAccount);
    }
  }, [defaultAccount, swap.from, setFromAccount]);

  const [error, setError] = useState(null);

  const [maxSpendable, setMaxSpendable] = useState();

  const {
    from: { account: fromAccount, parentAccount: fromParentAccount },
    refetchRates,
  } = swap;

  const resetError = useCallback(() => {
    setError();
  }, []);

  const fromUnit = useMemo(() => fromAccount && getAccountUnit(fromAccount), [
    fromAccount,
  ]);

  const onContinue = useCallback(() => {
    setConfirmed(true);
  }, []);

  const onReset = useCallback(() => {
    setConfirmed(false);
    setConfirmed(false);
  }, []);

  useEffect(() => {
    let expirationInterval;
    let rateExpiration;
    if (rate && rate.tradeMethod === "fixed") {
      rateExpiration = new Date(
        new Date().getTime() + ratesExpirationThreshold,
      );
      clearInterval(expirationInterval);
      expirationInterval = setInterval(() => {
        if (rate && rateExpiration && rateExpiration <= new Date()) {
          refetchRates();
          rateExpiration = null;
          clearInterval(expirationInterval);
        }
      }, 1000);
    }

    return () => clearInterval(expirationInterval);
  }, [rate, refetchRates]);

  useEffect(() => {
    if (!fromAccount) return;

    let cancelled = false;
    getAccountBridge(fromAccount, fromParentAccount)
      .estimateMaxSpendable({
        account: fromAccount,
        parentAccount: fromParentAccount,
        transaction,
      })
      .then(estimate => {
        if (cancelled) return;

        setMaxSpendable(estimate);
      });

    // eslint-disable-next-line consistent-return
    return () => {
      cancelled = true;
    };
  }, [fromAccount, fromParentAccount, transaction]);

  useEffect(() => {
    // update tx after a form navigation from fees edit to main screen
    if (route.params?.transaction) {
      setTransaction(route.params.transaction);
    }
  }, [route.params, setTransaction]);

  const exchangeRatesState = swap?.rates;
  const swapError = fromAmountError || exchangeRatesState?.error;

  const isSwapReady =
    !bridgePending &&
    exchangeRatesState.status !== "loading" &&
    transaction &&
    !swapError &&
    rate &&
    swap.to.account;

  const swapBody = (
    <KeyboardView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="Swap Form" providerName={provider} />
      <View>
        <AccountAmountRow
          navigation={navigation}
          route={route}
          swap={swap}
          transaction={transaction}
          setFromAccount={setFromAccount}
          setFromAmount={setFromAmount}
          setToCurrency={setToCurrency}
          useAllAmount={swap.isMaxEnabled}
          rate={rate}
          bridgePending={bridgePending}
          fromAmountError={swapError}
          providers={providers}
          provider={provider}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scrollZone}>
        <RatesSection
          navigation={navigation}
          route={route}
          swap={swap}
          transaction={transaction}
          status={status}
          rate={rate}
          setToAccount={setToAccount}
          accounts={accounts}
          providers={providers}
          provider={provider}
        />
        {error && (
          <GenericErrorBottomModal
            error={error}
            isOpened
            onClose={resetError}
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
              {maxSpendable ? (
                <CurrencyUnitValue
                  showCode
                  unit={fromUnit}
                  value={maxSpendable}
                />
              ) : (
                "-"
              )}
            </LText>
          </View>
          {maxSpendable ? (
            <View style={styles.availableRight}>
              <LText style={styles.maxLabel}>
                <Trans i18nKey="transfer.swap.form.amount.useMax" />
              </LText>
              <Switch
                style={styles.switch}
                value={swap.isMaxEnabled}
                onValueChange={value => {
                  Keyboard.dismiss();
                  toggleMax(value);
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
              targetCurrency: swap?.to?.currency?.id,
              sourceCurrency: swap?.from?.currency?.id,
            }}
            type="primary"
            disabled={!isSwapReady}
            title={<Trans i18nKey="transfer.swap.form.tab" />}
            onPress={onContinue}
          />
        </View>
        {confirmed ? (
          alreadyAcceptedTerms && deviceMeta ? (
            <>
              <Track
                onUpdate
                event={"Swap Form - AcceptedSummaryDisclaimer"}
                provider={provider}
              />
              <Confirmation
                swap={swap}
                rate={rate}
                status={status}
                transaction={transaction}
                deviceMeta={deviceMeta}
                provider={provider}
                onError={e => {
                  onReset();
                  setError(e);
                }}
                onCancel={onReset}
              />
            </>
          ) : !alreadyAcceptedTerms ? (
            <DisclaimerModal
              provider={provider}
              onContinue={() => {
                dispatch(swapAcceptProvider(provider));
                setConfirmed(true);
              }}
              onClose={() => setConfirmed(false)}
            />
          ) : null
        ) : null}
      </View>
    </KeyboardView>
  );

  return showDeviceConnect ? (
    <Connect provider={provider} setResult={setDeviceMeta} />
  ) : (
    swapBody
  );
}

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
    navigation.replace(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
    });
  }, [navigation]);

  const onNavigateBack = useCallback(() => {
    if (noAssetModalOpen) {
      setNoAssetModalOpen(false);
      navigation.goBack();
    }
  }, [navigation, noAssetModalOpen]);

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
