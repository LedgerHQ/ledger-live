// @flow
import React, { useCallback, useEffect, useState } from "react";
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import {
  getAccountUnit,
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAbandonSeedAddress } from "@ledgerhq/live-common/lib/currencies";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { AmountRequired, NotEnoughBalance } from "@ledgerhq/errors";
import { getExchangeRates } from "@ledgerhq/live-common/lib/exchange/swap";
import type { SwapRouteParams } from ".";
import KeyboardView from "../../../components/KeyboardView";
import LText from "../../../components/LText";
import SectionSeparator from "../../../components/SectionSeparator";
import CurrencyInput from "../../../components/CurrencyInput";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import TranslatedError from "../../../components/TranslatedError";
import Button from "../../../components/Button";
import Switch from "../../../components/Switch";
import { ScreenName } from "../../../const";

type Props = {
  navigation: any,
  route: {
    params: SwapRouteParams,
  },
};

const SwapFormAmount = ({ navigation, route }: Props) => {
  const { exchange } = route.params;
  const { fromAccount, fromParentAccount, toAccount } = exchange;
  const fromUnit = getAccountUnit(fromAccount);
  const toUnit = getAccountUnit(toAccount);
  const [error, setError] = useState(null);
  const [rate, setRate] = useState(null);
  const [rateExpiration, setRateExpiration] = useState(null);
  const [useAllAmount, setUseAllAmount] = useState(false);
  const [maxSpendable, setMaxSpendable] = useState(BigNumber(0));

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

        setRate(rates[0]); // FIXME when we have more rates, what?
        setRateExpiration(new Date(Date.now() + 60000));
      } catch (error) {
        if (ignore) return;
        setError(error);
      }
    }
    if (!ignore && !error && transaction.amount.gt(0)) {
      getRates();
    }

    return () => {
      ignore = true;
    };
  }, [exchange, fromAccount, toAccount, error, transaction]);

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

  return (
    <KeyboardView style={styles.container}>
      <View style={styles.wrapper}>
        <CurrencyInput
          editable={!useAllAmount}
          onChange={onAmountChange}
          unit={fromUnit}
          value={transaction.amount}
          renderRight={
            <LText
              style={[styles.currency, styles.active]}
              color="grey"
              tertiary
            >
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
          isActive={false}
          unit={toUnit}
          value={
            rate ? transaction.amount.times(rate.magnitudeAwareRate) : null
          }
          placeholder={"0"}
          editable={false}
          showAllDigits
          renderRight={
            <LText style={styles.currency} color="grey" tertiary>
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
    justifyContent: "center",
  },
  currency: {
    fontSize: 24,
  },
  active: {
    fontSize: 32,
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
