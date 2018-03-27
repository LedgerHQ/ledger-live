// @flow
import React, { Component } from "react";
import { connect } from "react-redux";
import { getFiatUnit } from "@ledgerhq/currencies";
import type { Unit, Currency } from "@ledgerhq/currencies";
import type { State } from "../reducers";

import CurrencyUnitValue from "./CurrencyUnitValue";
import { calculateCounterValueSelector } from "../reducers/counterValues";

const mapStateToProps = (state: State) => ({
  getCounterValue: calculateCounterValueSelector(state),
  fiatUnit: getFiatUnit(state.settings.counterValue)
});

class CounterValue extends Component<{
  value: number,
  currency: Currency,
  date?: Date,
  fiatUnit: Unit,
  getCounterValue: (Object, Object) => (number, ?Date) => number
}> {

  render() {
    const { value, date, currency, fiatUnit, getCounterValue } = this.props;
    const counterValue = getCounterValue(currency, fiatUnit)(value, date);
    return <CurrencyUnitValue unit={fiatUnit} value={counterValue} />;
  }
}

export default connect(mapStateToProps)(CounterValue);
