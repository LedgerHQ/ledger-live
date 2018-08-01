// @flow
import { Component } from "react";
import type { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/helpers/currencies";
import type { Unit } from "@ledgerhq/live-common/lib/types";

import { withLocale } from "../context/Locale";

class CurrencyUnitValue extends Component<{
  unit: Unit,
  value: BigNumber,
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
