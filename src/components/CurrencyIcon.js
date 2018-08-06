// @flow

import React, { PureComponent } from "react";
import { View } from "react-native";
import { getCryptoCurrencyIcon } from "@ledgerhq/live-common/lib/reactNative";
import type { Currency } from "@ledgerhq/live-common/lib/types";

type Props = {
  currency: Currency,
  size: number,
};

export default class CurrencyIcon extends PureComponent<Props> {
  render() {
    const { size, currency } = this.props;
    const IconComponent = getCryptoCurrencyIcon(currency);
    if (!IconComponent) {
      console.warn(
        `No icon for currency ${currency.name} (coinType ${currency.coinType})`,
      );
      return <View style={{ width: size, height: size }} />;
    }
    return <IconComponent size={size} color={currency.color} />;
  }
}
