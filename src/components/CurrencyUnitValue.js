// @flow
import { Component } from "react";

import { formatCurrencyUnit } from "@ledgerhq/currencies";
import type { Unit } from "@ledgerhq/currencies";

import { withLocale } from "./LocaleContext";

class CurrencyUnitValue extends Component<{
  unit: Unit,
  value: number,
  locale: string,
  showCode: boolean
}> {
  static defaultProps = {
    showCode: true
  };
  render() {
    const { unit, value, showCode, locale } = this.props;
    return formatCurrencyUnit(unit, value, {
      showCode,
      locale
    });
  }
}

export default withLocale(CurrencyUnitValue);
