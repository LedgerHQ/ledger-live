// @flow
import { formatCurrencyUnit } from "@ledgerhq/currencies";
import React, { Component } from "react";
import { connect } from 'react-redux';
import type { Unit, Currency } from '@ledgerhq/currencies';

import LText from "./LText";
import { calculateCounterValueSelector } from "../reducers/counterValues";


const mapStateToProps = state => ({
  getCounterValue: calculateCounterValueSelector(state)
})

class CounterValue extends Component<{
  value: number,
  currency: Currency,
  date?: Date,
  fiatUnit: Unit,
  getCounterValue: (Object, Object) => (number, ?Date) => void
}> {
  static defaultProps = {};
  
  render() {
    const { value, date, currency, fiatUnit, getCounterValue } = this.props;
    const counterValue = getCounterValue(currency, fiatUnit)(value, date);
    return (
      <LText style={{
        fontSize: 12,
        opacity: 0.5
      }}>
        {formatCurrencyUnit(fiatUnit, counterValue, {
          showCode: true
        })}
      </LText>
    );
  }
}

export default connect(mapStateToProps)(CounterValue)
