// @flow
import { Component } from "react";
import type { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import type { Unit } from "@ledgerhq/live-common/lib/types";

import { withLocale } from "../context/Locale";

class CurrencyUnitValue extends Component<{
  unit: Unit,
  value: BigNumber,
  locale: string,
  showCode: boolean,
  alwaysShowSign?: boolean,
  before: string,
  after: string,
}> {
  static defaultProps = {
    showCode: true,
    before: "",
    after: "",
  };

  render() {
    const { unit, value, before, after, ...rest } = this.props;
    return (
      before +
      formatCurrencyUnit(unit, value, {
        ...rest,
      }) +
      after
    );
  }
}

export default withLocale(CurrencyUnitValue);
