// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import type { Unit, Currency } from "@ledgerhq/currencies";
import type { CalculateCounterValue } from "@ledgerhq/wallet-common/lib/types";
import { View, StyleSheet } from "react-native";
import type { State } from "../reducers";
import { fiatUnitSelector } from "../reducers/settings";
import CurrencyUnitInput from "./CurrencyUnitInput";
import {
  calculateCounterValueSelector,
  reverseCounterValueSelector
} from "../reducers/counterValues";

const styles = StyleSheet.create({
  root: {
    flexDirection: "column"
  }
});

const mapStateToProps = (state: State) => ({
  fiatUnit: fiatUnitSelector(state),
  calculateCounterValue: calculateCounterValueSelector(state),
  reverseCounterValue: reverseCounterValueSelector(state)
});

class CurrencyDoubleInput extends Component<{
  value: number,
  onChange: number => void,
  currency: Currency,
  unit: Unit,
  // connected
  calculateCounterValue: CalculateCounterValue,
  reverseCounterValue: CalculateCounterValue,
  fiatUnit: Unit
}> {
  onChangeAmount = (value: number) => {
    const { onChange } = this.props;
    onChange(value);
  };

  onChangeCountervalueAmount = (countervalue: number) => {
    const { reverseCounterValue, onChange, currency, fiatUnit } = this.props;
    const value = reverseCounterValue(currency, fiatUnit)(countervalue);
    onChange(value);
  };

  render() {
    const {
      value,
      currency,
      unit,
      fiatUnit,
      calculateCounterValue
    } = this.props;
    const countervalue = calculateCounterValue(currency, fiatUnit)(value);
    return (
      <View style={styles.root}>
        <CurrencyUnitInput
          value={value}
          unit={unit}
          onChange={this.onChangeAmount}
        />
        <View style={{ height: 2 }} />
        <CurrencyUnitInput
          value={countervalue}
          onChange={this.onChangeCountervalueAmount}
          unit={fiatUnit}
        />
      </View>
    );
  }
}

export default connect(mapStateToProps)(CurrencyDoubleInput);
