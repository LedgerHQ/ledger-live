// @flow
import React, { Component } from "react";
import { StyleSheet } from "react-native";

import { connect } from "react-redux";
import { formatCurrencyUnit, getFiatUnit } from "@ledgerhq/currencies";
import type { Unit, FiatUnit, Currency } from "@ledgerhq/currencies";
import type { Calc } from "@ledgerhq/wallet-common/lib/types";

import type { State } from "../reducers";
import LText from "./LText";
import { calculateCounterValueSelector } from "../reducers/counterValues";

type Props = {
  unit: Unit,
  currency: Currency
};

const mapStateToProps = (state: State, props: Props) => {
  const fiatUnit = getFiatUnit(state.settings.counterValue);
  return {
    calc: calculateCounterValueSelector(state)(props.currency, fiatUnit),
    fiatUnit
  };
};

class CurrencyRate extends Component<
  Props & {
    fiatUnit: FiatUnit,
    calc: Calc
  }
> {
  render() {
    const { unit, fiatUnit, calc } = this.props;
    const value = 10 ** unit.magnitude; // 1 in the unit
    const countervalue = calc(value, undefined, true);
    const valueFormat = formatCurrencyUnit(unit, value, {
      showCode: true
    });
    const fiatFormat = formatCurrencyUnit(fiatUnit, countervalue, {
      showCode: true,
      subMagnitude: 3
    });
    return (
      <LText numberOfLines={1} style={styles.inputTitle}>
        {`${valueFormat} = ${fiatFormat}`}
      </LText>
    );
  }
}
export default connect(mapStateToProps)(CurrencyRate);

const styles = StyleSheet.create({
  inputTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10
  }
});
