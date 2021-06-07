// @flow
import React, { useMemo, useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";

import invariant from "invariant";
import { BigNumber } from "bignumber.js";

import {
  getAccountUnit,
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/lib/currencies";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { AmountRequired, NotEnoughBalance } from "@ledgerhq/errors";
import { getEnabledTradeMethods } from "@ledgerhq/live-common/lib/exchange/swap/logic";
import { getExchangeRates } from "@ledgerhq/live-common/lib/exchange/swap";

import { swapSupportedCurrenciesSelector } from "../../../../reducers/settings";
import KeyboardView from "../../../../components/KeyboardView";
import LText from "../../../../components/LText";
import getFontStyle from "../../../../components/LText/getFontStyle";
import SectionSeparator from "../../../../components/SectionSeparator";
import CurrencyInput from "../../../../components/CurrencyInput";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
import TranslatedError from "../../../../components/TranslatedError";
import Button from "../../../../components/Button";
import ToggleButton from "../../../../components/ToggleButton";
import Switch from "../../../../components/Switch";
import { ScreenName } from "../../../../const";

import Rate from "./Rate";
import type { SwapRouteParams } from ".";

type Props = {
  navigation: any,
  route: {
    params: SwapRouteParams,
  },
};

const SwapFormAmount = ({ navigation, route }: Props) => {
  const { exchange } = route.params;
  const { fromAccount, fromParentAccount, toAccount } = exchange;
  const fromCurrency = getAccountCurrency(fromAccount);
  const toCurrency = getAccountCurrency(toAccount);
  const fromUnit = getAccountUnit(fromAccount);
  const toUnit = getAccountUnit(toAccount);
  const [error, setError] = useState(null);
  const [rate, setRate] = useState(null);
  const [rateExpiration, setRateExpiration] = useState(null);
  const [useAllAmount, setUseAllAmount] = useState(false);
  const [maxSpendable, setMaxSpendable] = useState(BigNumber(0));
  const selectableCurrencies = useSelector(swapSupportedCurrenciesSelector);
  const enabledTradeMethods = useMemo(
    () =>
      getEnabledTradeMethods({
        selectableCurrencies,
        fromCurrency,
        toCurrency,
      }),
    [fromCurrency, selectableCurrencies, toCurrency],
  );
  const [tradeMethod, setTradeMethod] = useState<"fixed" | "float">(
    enabledTradeMethods[0] || "fixed",
  );

  const {
    status,
    transaction,
    setTransaction,
    bridgePending,
  } = useBridgeTransaction(() => ({
    account: fromAccount,
    parentAccount: fromParentAccount,
  }));

  invariant(transaction, "transaction must be defined");
  const onTradeMethodChange = useCallback(method => {
    if (method === "fixed" || method === "float") {
      setTradeMethod(method);
      setRate(null);
      setRateExpiration(null);
    }
  }, []);
  const onAmountChange = useCallback(
    amount => {
      if (!amount.eq(transaction.amount)) {
        const bridge = getAccountBridge(fromAccount, fromParentAccount);
        const fromCurrency = getAccountCurrency(
          getMainAccount(fromAccount, fromParentAccount),
        );
        setTransaction(
          bridge.updateTransaction(transaction, {
            amount,
            recipient: getAbandonSeedAddress(fromCurrency.id),
          }),
        );
        setRate(null);
        setRateExpiration(null);

        if (maxSpendable && maxSpendable.gt(0) && amount.gt(maxSpendable)) {
          setError(new NotEnoughBalance());
        } else {
          setError(null);
        }
      }
    },
    [fromAccount, fromParentAccount, maxSpendable, setTransaction, transaction],
  );

  useEffect(() => {
    let ignore = false;
    async function getEstimatedMaxSpendable() {
      const bridge = getAccountBridge(fromAccount, fromParentAccount);
      const max = await bridge.estimateMaxSpendable({
        account: fromAccount,
        parentAccount: fromParentAccount,
        transaction,
      });
      setMaxSpendable(max);
    }
    if (!ignore) {
      getEstimatedMaxSpendable();
    }

    return () => {
      ignore = true;
    };
  }, [transaction, fromAccount, fromParentAccount]);

  useEffect(() => {
    let ignore = false;
    async function getRates() {
      try {
        const rates = await getExchangeRates(exchange, transaction);
        if (ignore) return;
        let rate = rates.find(rate => rate.tradeMethod === tradeMethod);
        rate = rate || rates.find(rate => !rate.tradeMethod); // Fixme, we need the trademethod even on error
        if (rate?.error) {
          setError(rate.error);
        } else {
          setRate(rate); // FIXME when we have multiple providers this will not be enough
          setRateExpiration(new Date(Date.now() + 60000));
        }
      } catch (error) {
        if (ignore) return;
        setError(error);
      }
    }
    if (!ignore && !error && transaction.amount.gt(0) && !rate) {
      getRates();
    }

    return () => {
      ignore = true;
    };
  }, [exchange, fromAccount, toAccount, error, transaction, tradeMethod, rate]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.SwapSummary, {
      ...route.params,
      exchange,
      exchangeRate: rate,
      transaction,
      status,
      rateExpiration,
    });
  }, [
    navigation,
    route.params,
    exchange,
    rate,
    transaction,
    status,
    rateExpiration,
  ]);

  const toggleSendMax = useCallback(() => {
    const newUseAllAmount = !useAllAmount;
    setUseAllAmount(newUseAllAmount);
    onAmountChange(newUseAllAmount ? maxSpendable : BigNumber(0));
  }, [useAllAmount, setUseAllAmount, onAmountChange, maxSpendable]);

  const hasErrors = Object.keys(status.errors).length;
  const canContinue = !bridgePending && !hasErrors && rate;

  const amountError =
    transaction.amount.gt(0) &&
    (error || status.errors?.gasPrice || status.errors?.amount);
  const hideError =
    bridgePending ||
    (useAllAmount && amountError && amountError instanceof AmountRequired);

  const options = [
    {
      value: "float",
      label: <Trans i18nKey="transfer.swap.tradeMethod.float" />,
      disabled: !enabledTradeMethods.includes("float"),
    },
    {
      value: "fixed",
      label: <Trans i18nKey="transfer.swap.tradeMethod.fixed" />,
      disabled: !enabledTradeMethods.includes("fixed"),
    },
  ];

  const toValue = rate
    ? transaction.amount
        .times(rate.magnitudeAwareRate)
        .minus(rate.payoutNetworkFees || 0)
    : null;

  const actualRate = toValue ? toValue.dividedBy(transaction.amount) : null;

  return (
    <KeyboardView style={styles.container}>
      <View style={styles.toggleWrapper}>
        <ToggleButton
          value={tradeMethod}
          options={options}
          onChange={onTradeMethodChange}
        />
      </View>
      <View style={styles.rateWrapper}>
        {actualRate && rateExpiration ? (
          <Rate
            rateExpiration={rateExpiration}
            tradeMethod={tradeMethod}
            magnitudeAwareRate={actualRate}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            onRatesExpired={setRate}
          />
        ) : (
          <View style={styles.ratePlaceholder} />
        )}
      </View>
      <View style={styles.wrapper}>
        <CurrencyInput
          editable={!useAllAmount}
          onChange={onAmountChange}
          unit={fromUnit}
          value={transaction.amount}
          isActive
          renderRight={
            <LText style={[styles.currency, styles.active]} color={"grey"}>
              {fromUnit.code}
            </LText>
          }
          hasError={!hideError && !!error}
        />
        <LText
          style={[styles.error]}
          color={amountError ? "alert" : "orange"}
          numberOfLines={2}
        >
          <TranslatedError error={(!hideError && amountError) || undefined} />
        </LText>
      </View>
      <SectionSeparator />
      <View style={styles.wrapper}>
        <CurrencyInput
          unit={toUnit}
          value={toValue}
          placeholder={"0"}
          editable={false}
          inputStyle={styles.currency}
          renderRight={
            <LText style={styles.currency} color="grey">
              {toUnit.code}
            </LText>
          }
        />
      </View>
      <View style={styles.bottomWrapper}>
        <View style={styles.available}>
          <View style={styles.availableLeft}>
            <LText color="grey">
              <Trans i18nKey="transfer.swap.form.amount.available" />
            </LText>
            <LText tertiary>
              <CurrencyUnitValue
                showCode
                unit={fromUnit}
                value={maxSpendable}
              />
            </LText>
          </View>
          <View style={styles.availableRight}>
            <LText style={styles.maxLabel} color="grey">
              <Trans i18nKey="transfer.swap.form.amount.useMax" />
            </LText>
            <Switch
              style={styles.switch}
              value={useAllAmount}
              disabled={(!!error && !useAllAmount) || maxSpendable.eq(0)}
              onValueChange={toggleSendMax}
            />
          </View>
        </View>
        <View style={styles.continueWrapper}>
          <Button
            event="SwapAmountContinue"
            type="primary"
            disabled={!canContinue}
            title={
              <Trans
                i18nKey={
                  bridgePending
                    ? "transfer.swap.loadingFees"
                    : "common.continue"
                }
              />
            }
            onPress={onContinue}
          />
        </View>
      </View>
    </KeyboardView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  wrapper: {
    flexBasis: 80,
    flexDirection: "column",
    justifyContent: "flex-start",
    paddingTop: 18,
  },
  toggleWrapper: {
    alignItems: "center",
    display: "flex",
    width: 230,
    alignSelf: "center",
    marginTop: 10,
  },
  rateWrapper: {
    padding: 25,
  },
  ratePlaceholder: {
    height: 16,
  },
  currency: {
    fontSize: 20,
  },
  active: {
    fontSize: 30,
    ...getFontStyle({ semiBold: true }),
  },
  error: {
    fontSize: 14,
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
  bottomWrapper: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  amountWrapper: {
    flex: 1,
  },
  switch: {
    opacity: 0.99,
  },
  available: {
    flexDirection: "row",
    display: "flex",
    marginBottom: 16,
  },
});

export default SwapFormAmount;
