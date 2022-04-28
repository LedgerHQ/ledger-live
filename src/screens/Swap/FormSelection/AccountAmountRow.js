// @flow
import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";

import { getAccountUnit } from "@ledgerhq/live-common/lib/account";

import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import { AmountRequired } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";

import type {
  Account,
  TokenAccount,
  TokenCurrency,
  CryptoCurrency,
} from "@ledgerhq/live-common/lib/types";
import type { SwapTransaction } from "@ledgerhq/live-common/lib/exchange/swap/types";
import type { SwapDataType } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import type { SwapRouteParams } from "..";

import LText from "../../../components/LText";
import AccountSelect from "./AccountSelect";
import CurrencyInput from "../../../components/CurrencyInput";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import TranslatedError from "../../../components/TranslatedError";
import getFontStyle from "../../../components/LText/getFontStyle";
import CounterValue from "../../../components/CounterValue";
import CurrencyTargetSelect from "./CurrencyTargetSelect";

type Props = {
  navigation: *,
  route: { params: SwapRouteParams },
  swap: SwapDataType,
  setFromAccount: (account?: Account | TokenAccount) => void,
  setFromAmount: (amount: BigNumber) => void,
  setToCurrency: (currency?: TokenCurrency | CryptoCurrency) => void,
  useAllAmount: boolean,
  transaction: SwapTransaction,
  bridgePending: boolean,
  rate: any,
  fromAmountError?: Error,
  providers: any,
  provider: any,
};

export default function AccountAmountRow({
  navigation,
  route,
  useAllAmount,
  swap,
  setFromAccount,
  setFromAmount,
  setToCurrency,
  rate,
  bridgePending,
  fromAmountError,
  providers,
  provider,
}: Props) {
  const { colors } = useTheme();
  const {
    from: { account },
    to: { currency: toCurrency },
    rates: { status: ratesStatus },
  } = swap;

  const fromUnit = account && getAccountUnit(account);
  const toUnit = toCurrency?.units[0];

  const hideError =
    bridgePending ||
    (useAllAmount &&
      fromAmountError &&
      fromAmountError instanceof AmountRequired);

  const toValue = rate?.toAmount;

  return (
    <View>
      <View>
        <LText semiBold color="grey" style={styles.label}>
          <Trans i18nKey="transfer.swap.form.from" />
        </LText>
        <View style={styles.root}>
          <AccountSelect
            swap={swap}
            navigation={navigation}
            route={route}
            setFromAccount={setFromAccount}
            providers={providers}
            provider={provider}
          />
          <View style={styles.wrapper}>
            {fromUnit ? (
              <CurrencyInput
                editable={!useAllAmount}
                onChange={setFromAmount}
                unit={fromUnit}
                value={swap.from.amount}
                inputStyle={styles.inputText}
                hasError={!hideError && !!fromAmountError}
                dynamicFontRatio={0.3}
              />
            ) : (
              <LText semiBold color="grey" style={styles.inputText}>
                0
              </LText>
            )}
          </View>
        </View>
        <LText style={[styles.error]} color={"alert"} numberOfLines={2}>
          <TranslatedError
            error={(!hideError && fromAmountError) || undefined}
          />
        </LText>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.fog }]} />
      <View>
        <LText semiBold color="grey" style={styles.label}>
          <Trans i18nKey="transfer.swap.form.to" />
        </LText>
        <View style={styles.root}>
          <CurrencyTargetSelect
            swap={swap}
            navigation={navigation}
            route={route}
            setToCurrency={setToCurrency}
            providers={providers}
            provider={provider}
          />
          <View style={styles.wrapper}>
            {ratesStatus === "loading" ? (
              <ActivityIndicator color={colors.grey} animating />
            ) : toUnit && toCurrency ? (
              <View>
                <LText
                  adjustsFontSizeToFit
                  semiBold
                  color="grey"
                  style={styles.inputText}
                >
                  <CurrencyUnitValue
                    unit={toUnit}
                    value={toValue ?? BigNumber(0)}
                  />
                </LText>
                <LText semiBold color="grey" style={styles.subText}>
                  <CounterValue
                    currency={toCurrency}
                    value={toValue ?? BigNumber(0)}
                  />
                </LText>
              </View>
            ) : (
              <LText semiBold color="grey" style={styles.inputText}>
                0
              </LText>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 32,
    marginVertical: 10,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
  },
  divider: {
    width: "100%",
    height: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  wrapper: {
    flexShrink: 0,
    minWidth: "50%",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 32,
  },
  currency: {
    fontSize: 20,
  },
  active: {
    ...getFontStyle({ semiBold: true }),
    fontSize: 30,
  },
  error: {
    fontSize: 14,
    textAlign: "right",
  },
  inputText: {
    textAlign: "right",
    height: 32,
    padding: 0,
  },
  subText: { textAlign: "right", fontSize: 13 },
});
