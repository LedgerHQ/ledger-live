// @flow
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { BigNumber } from "bignumber.js";
import type { Account, Currency } from "@ledgerhq/live-common/lib/types";
import { translate } from "react-i18next";
import { compose } from "redux";
import { track } from "../../analytics";
import {
  counterValueCurrencySelector,
  currencySettingsSelector,
  counterValueExchangeSelector,
  intermediaryCurrency,
} from "../../reducers/settings";
import type { State } from "../../reducers";

import LText from "../../components/LText/index";
import CounterValues from "../../countervalues";
import colors from "../../colors";

import CounterValuesSeparator from "./CounterValuesSeparator";
import CurrencyInput from "../../components/CurrencyInput";
import TranslatedError from "../../components/TranslatedError";
import type { T } from "../../types/common";

type OwnProps = {
  account: Account,
  currency: string,
  value: BigNumber,
  onChange: BigNumber => void,
  error?: Error,
};

type Props = OwnProps & {
  fiatCurrency: Currency,
  hasRateProvider: boolean,
  t: T,
  getCounterValue: BigNumber => ?BigNumber,
  getReverseCounterValue: BigNumber => ?BigNumber,
};

type OwnState = {
  active: "crypto" | "fiat",
};

class AmountInput extends Component<Props, OwnState> {
  input = React.createRef();

  state = {
    active: "crypto",
  };

  componentDidMount() {
    if (this.input.current) {
      this.input.current.focus();
    }
  }

  handleAmountChange = (changeField: "crypto" | "fiat") => (
    value: BigNumber,
  ) => {
    const { getReverseCounterValue, onChange } = this.props;
    if (changeField === "crypto") {
      onChange(value);
    } else {
      const cryptoVal = getReverseCounterValue(value) || BigNumber(0);
      onChange(cryptoVal);
    }
  };

  onCryptoFieldChange = this.handleAmountChange("crypto");

  onFiatFieldChange = this.handleAmountChange("fiat");

  onFocus = (direction: "crypto" | "fiat") => () => {
    this.setState({ active: direction });
    track(
      direction === "crypto"
        ? "SendAmountCryptoFocused"
        : "SendAmountFiatFocused",
    );
  };

  onCryptoFieldFocus = this.onFocus("crypto");

  onFiatFieldFocus = this.onFocus("fiat");

  render() {
    const { active } = this.state;
    const {
      t,
      currency,
      value,
      fiatCurrency,
      getCounterValue,
      account,
      error,
      hasRateProvider,
    } = this.props;
    const isCrypto = active === "crypto";
    const fiat = value ? getCounterValue(value) : BigNumber(0);
    const rightUnit = fiatCurrency.units[0];
    return (
      <View style={styles.container}>
        <View style={styles.wrapper}>
          <CurrencyInput
            isActive={isCrypto}
            onFocus={this.onCryptoFieldFocus}
            onChange={this.onCryptoFieldChange}
            unit={account.unit}
            value={value}
            renderRight={
              <LText
                style={[styles.currency, isCrypto ? styles.active : null]}
                tertiary
              >
                {currency}
              </LText>
            }
            hasError={!!error}
          />
          <LText style={styles.error} numberOfLines={2}>
            <TranslatedError error={error} />
          </LText>
        </View>
        <CounterValuesSeparator />
        <View style={styles.wrapper}>
          <CurrencyInput
            isActive={!isCrypto}
            onFocus={this.onFiatFieldFocus}
            onChange={this.onFiatFieldChange}
            unit={rightUnit}
            value={hasRateProvider ? fiat : null}
            placeholder={
              !hasRateProvider ? t("send.amount.noRateProvider") : undefined
            }
            editable={hasRateProvider}
            showAllDigits
            renderRight={
              <LText
                style={[styles.currency, !isCrypto ? styles.active : null]}
                tertiary
              >
                {rightUnit.code}
              </LText>
            }
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    minHeight: 100,
    flexDirection: "column",
    justifyContent: "center",
  },
  currency: {
    fontSize: 24,
    color: colors.grey,
  },
  active: {
    fontSize: 32,
  },
  error: {
    color: colors.alert,
    fontSize: 14,
  },
});

const mapStateToProps = (state: State, props: OwnProps) => {
  const {
    account: { currency },
  } = props;

  const counterValueCurrency = counterValueCurrencySelector(state);
  const fromExchange = currencySettingsSelector(state, { currency }).exchange;
  const toExchange = counterValueExchangeSelector(state);

  const getCounterValue = value =>
    CounterValues.calculateWithIntermediarySelector(state, {
      from: currency,
      fromExchange,
      intermediary: intermediaryCurrency,
      toExchange,
      to: counterValueCurrency,
      value,
      disableRounding: true,
    });

  const getReverseCounterValue = value =>
    CounterValues.reverseWithIntermediarySelector(state, {
      from: currency,
      fromExchange,
      intermediary: intermediaryCurrency,
      toExchange,
      to: counterValueCurrency,
      value,
    });

  return {
    fiatCurrency: counterValueCurrency,
    hasRateProvider: !!fromExchange || currency.id === "bitcoin",
    getCounterValue,
    getReverseCounterValue,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(AmountInput);
