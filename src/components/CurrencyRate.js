// @flow
import { Component } from "react";
import { connect } from "react-redux";
import { formatCurrencyUnit, getFiatUnit } from "@ledgerhq/currencies";
import type { Unit, FiatUnit, Currency } from "@ledgerhq/currencies";
import type { Calc } from "@ledgerhq/wallet-common/lib/types";
import type { State } from "../reducers";
import { calculateCounterValueSelector } from "../reducers/counterValues";

type Props = {
  unit?: Unit,
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
    const { props } = this;
    const { currency, fiatUnit, calc } = props;
    const unit = props.unit || currency.units[0];
    const value = 10 ** unit.magnitude; // 1 in the unit
    const countervalue = calc(value, undefined, true);
    const valueFormat = formatCurrencyUnit(unit, value, {
      showCode: true
    });
    const fiatFormat = formatCurrencyUnit(fiatUnit, countervalue, {
      showCode: true,
      subMagnitude: 3
    });
    return `${valueFormat} = ${fiatFormat}`;
  }
}
export default connect(mapStateToProps)(CurrencyRate);
