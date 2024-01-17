import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, Flex } from "@ledgerhq/native-ui";
import { ExchangeRate, OnNoRatesCallback } from "@ledgerhq/live-common/exchange/swap/types";
import { useSwapTransaction, usePageState } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  flattenAccounts,
  accountWithMandatoryTokens,
  getParentAccount,
  isTokenAccount,
  getFeesUnit,
} from "@ledgerhq/live-common/account/index";

import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { log } from "@ledgerhq/logs";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { rateSelector, updateRateAction, updateTransactionAction } from "~/actions/swap";
import { TrackScreen, useAnalytics } from "~/analytics";
import { Loading } from "../Loading";
import { TxForm } from "./TxForm";
import { Summary } from "./Summary";
import { sharedSwapTracking, useTrackSwapError } from "../utils";
import EmptyState from "./EmptyState";
import { Max } from "./Max";
import { Modal } from "./Modal";
import { Connect } from "./Connect";
import { DeviceMeta } from "./Modal/Confirmation";
import {
  MaterialTopTabNavigatorProps,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { SwapFormNavigatorParamList } from "~/components/RootNavigator/types/SwapFormNavigator";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { DetailsSwapParamList } from "../types";
import { getAvailableProviders } from "@ledgerhq/live-common/exchange/swap/index";

type Navigation = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.Account>;

export function SwapForm({
  route: { params },
}: MaterialTopTabNavigatorProps<SwapFormNavigatorParamList, ScreenName.SwapForm>) {
  const { track } = useAnalytics();
  const trackSwapError = useTrackSwapError();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accounts = useSelector(shallowAccountsSelector);
  const exchangeRate = useSelector(rateSelector);
  // mobile specific
  const [confirmed, setConfirmed] = useState(false);

  const setExchangeRate = useCallback(
    (rate?: ExchangeRate) => {
      dispatch(updateRateAction(rate));
    },
    [dispatch],
  );

  const walletApiPartnerList = useFeature("swapWalletApiPartnerList");
  const navigation = useNavigation<Navigation["navigation"]>();

  const onNoRates: OnNoRatesCallback = useCallback(
    ({ toState, fromState }) => {
      track("error_message", {
        ...sharedSwapTracking,
        message: "no_rates",
        sourceCurrency: fromState.currency?.name,
        targetCurrency: toState.currency?.name,
      });
    },
    [track],
  );

  const swapTransaction = useSwapTransaction({
    ...params,
    accounts,
    setExchangeRate,
    onNoRates,
    excludeFixedRates: true,
  });

  // @TODO: Try to check if we can directly have the right state from `useSwapTransaction`
  // Used to set the right state (recipient address, data, etc...) when comming from a token account
  // As of today, we need to call setFromAccount to trigger an updateTransaction in order to set the correct
  // recipient address (token contract address) and related data to compute the fees
  // cf. https://github.com/LedgerHQ/ledger-live/blob/c135c887b313ecc9f4a3b3a421ced0e3a081dc37/libs/ledger-live-common/src/exchange/swap/hooks/useFromState.ts#L50-L57
  useEffect(() => {
    if (swapTransaction.account) {
      swapTransaction.setFromAccount(swapTransaction.account);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exchangeRatesState = swapTransaction.swap?.rates;
  const { partnersList, exchangeRateList } = useMemo(() => {
    const partnerAndExchangeRateDefault = {
      partnersList: [],
      exchangeRateList: [],
    };

    return (
      exchangeRatesState.value?.reduce<{
        partnersList: string[];
        exchangeRateList: string[];
      }>((prev, curr) => {
        return {
          partnersList: [...new Set([...prev.partnersList, curr.provider])],
          exchangeRateList: [
            ...prev.exchangeRateList,
            formatCurrencyUnit(getFeesUnit(swapTransaction.swap.to.currency!), curr.toAmount),
          ],
        };
      }, partnerAndExchangeRateDefault) ?? partnerAndExchangeRateDefault
    );
  }, [exchangeRatesState.value, swapTransaction.swap.to.currency]);

  const swapError = swapTransaction.fromAmountError || exchangeRatesState?.error;
  const swapWarning = swapTransaction.fromAmountWarning;
  const pageState = usePageState(swapTransaction, swapError || swapWarning);
  const provider = exchangeRate?.provider;

  const editRatesTrackingProps = JSON.stringify({
    ...sharedSwapTracking,
    provider,
    partnersList,
    exchangeRateList,
    sourceCurrency: swapTransaction.swap.from.currency?.id,
    targetCurrency: swapTransaction.swap.from.currency?.id,
  });

  useEffect(() => {
    if (pageState === "loaded") {
      track("Swap Form - Edit Rates", {
        ...sharedSwapTracking,
        provider,
        partnersList,
        exchangeRateList,
        sourceCurrency: swapTransaction.swap.from.currency?.id,
        targetCurrency: swapTransaction.swap.from.currency?.id,
      });
    }
    /*
     * By stringify-ing editRatesTrackingProps we are guaranteeing that the useEffect will
     * only be rerun if there is a change in the editRatesTrackingProps keys & values.
     * If we were to pass an object here the useEffect would re-run on
     * each new creation of that object even if all the keys and values
     * are the same. Causing unnecessary sends to segment/mixpanel.
     */

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState, editRatesTrackingProps]);

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
      const swapErrorOrWarning = swapError || swapWarning;
      if (swapErrorOrWarning) {
        trackSwapError(swapErrorOrWarning, {
          sourcecurrency: swapTransaction.swap.from.currency?.name,
          provider,
        });
        // eslint-disable-next-line no-console
        console.log("Swap Error", swapErrorOrWarning);
        log("swap", "failed to fetch swaps", swapErrorOrWarning);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [swapError, swapWarning],
  );

  const isSwapReady =
    !swapTransaction.bridgePending &&
    exchangeRatesState.status !== "loading" &&
    swapTransaction.transaction &&
    !swapError &&
    !swapWarning &&
    exchangeRate &&
    swapTransaction.swap.to.account;

  const onSubmit = useCallback(() => {
    if (!exchangeRate) return;
    const { provider, providerURL, providerType } = exchangeRate;
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

    if (providerType === "DEX") {
      const from = swapTransaction.swap.from;
      const fromAccountId = from.parentAccount?.id || from.account?.id;

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
      navigation.navigate(ScreenName.PlatformApp, {
        platform: getProviderName(provider).toLowerCase(),
        name: getProviderName(provider),
        accountId,
        customDappURL: providerURL,
      });
    } else {
      swapTransaction.transaction ? (swapTransaction.transaction.useAllAmount = false) : null;
      setConfirmed(true);
    }
  }, [
    exchangeRate,
    track,
    swapTransaction.transaction,
    swapTransaction.swap.from,
    swapTransaction.swap.to.currency?.name,
    navigation,
    walletApiPartnerList?.enabled,
    walletApiPartnerList?.params?.list,
    accounts,
  ]);

  const onCloseModal = useCallback(() => {
    setConfirmed(false);
  }, []);

  useEffect(() => {
    const { currency, accountId, target, transaction } = params as DetailsSwapParamList;

    if (currency) {
      swapTransaction.setToCurrency(currency);
    }

    if (accountId) {
      const enhancedAccounts =
        target === "from"
          ? accounts
          : accounts.map(acc =>
              accountWithMandatoryTokens(acc, [(currency as TokenCurrency) || []]),
            );

      const account = flattenAccounts(enhancedAccounts).find(a => a.id === accountId);

      if (target === "from") {
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

      if (target === "to") {
        swapTransaction.setToAccount(
          swapTransaction.swap.to.currency,
          account,
          isTokenAccount(account) ? getParentAccount(account, accounts) : undefined,
        );
      }
    }

    if (transaction) {
      swapTransaction.setTransaction(transaction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    const { rate } = params as DetailsSwapParamList;
    if (rate) {
      setExchangeRate(rate);
    }
  }, [params, setExchangeRate, swapTransaction]);

  const swapAcceptedProviders = getAvailableProviders();
  const termsAccepted = (swapAcceptedProviders || []).includes(provider ?? "");
  const [deviceMeta, setDeviceMeta] = useState<DeviceMeta>();

  // TODO: investigate this logic
  if (confirmed && !deviceMeta && termsAccepted) {
    return <Connect provider={provider} setResult={setDeviceMeta} />;
  }

  if (getAvailableProviders().length) {
    return (
      <KeyboardAwareScrollView testID="exchange-scrollView">
        <Flex flex={1} justifyContent="space-between" padding={6}>
          <Flex flex={1}>
            <TrackScreen category="Swap" providerName={provider} {...sharedSwapTracking} />
            <TxForm
              swapTx={swapTransaction}
              provider={provider}
              exchangeRate={exchangeRate}
              swapError={swapError}
              swapWarning={swapWarning}
              isSendMaxLoading={swapTransaction.swap.isMaxLoading}
            />
            {(pageState === "empty" || pageState === "loading") && (
              <Flex height={200} alignItems={"center"} justifyContent={"center"}>
                {pageState === "empty" && <EmptyState />}
                {pageState === "loading" && <Loading size={20} color="neutral.c70" />}
              </Flex>
            )}

            {pageState === "loaded" && (
              <>
                {exchangeRate &&
                  swapTransaction.swap.to.currency &&
                  swapTransaction.swap.from.currency && (
                    <Summary provider={provider} swapTx={swapTransaction} />
                  )}
              </>
            )}
          </Flex>

          <Flex paddingY={4}>
            <Max swapTx={swapTransaction} />

            <Button type="main" disabled={!isSwapReady} onPress={onSubmit} testID="exchange-button">
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

  return <Loading />;
}
