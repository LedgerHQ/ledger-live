// @flow

import React, { PureComponent } from "react";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { rgba } from "../colors";
import CurrencyIcon from "./CurrencyIcon";
import Rounded from "./Rounded";

export default class RoundedCurrencyIcon extends PureComponent<{
  currency: CryptoCurrency,
  size: number,
}> {
  render() {
    const { currency, size } = this.props;
    return (
      <Rounded bg={rgba(currency.color, 0.1)}>
        <CurrencyIcon currency={currency} size={size} />
      </Rounded>
    );
  }
}
