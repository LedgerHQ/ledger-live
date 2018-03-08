// @flow
import { formatCurrencyUnit } from "@ledgerhq/currencies";
import type { Unit } from "@ledgerhq/currencies";

import React, { Component } from "react";
import LText from "./LText";
import { withLocale } from "./LocaleContext";

class CurrencyUnitValue extends Component<{
  unit: Unit,
  value: number,
  locale: string,
  showCode: boolean,
  ltextProps: *
}> {
  static defaultProps = {
    showCode: true,
    ltextProps: {}
  };
  render() {
    const { unit, value, showCode, locale, ltextProps } = this.props;
    return (
      <LText {...ltextProps}>
        {formatCurrencyUnit(unit, value, {
          showCode,
          locale
        })}
      </LText>
    );
  }
}

export default withLocale(CurrencyUnitValue);
