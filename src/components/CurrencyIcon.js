// @flow

import React, { PureComponent } from "react";
import { View } from "react-native";
import { getIconByCoinType } from "@ledgerhq/currencies/reactNative";
import type { Currency } from "@ledgerhq/currencies";

type Props = {
  currency: Currency,
  size: number
};

type typeIcon = React$ComponentType<{ size: number, color: string }>;
export default class CurrencyIcon extends PureComponent<Props> {
  render() {
    const { size, currency } = this.props;
    const IconComponent: typeIcon = getIconByCoinType(currency.coinType);
    if (!IconComponent) {
      console.log(
        `No icon for currency ${currency.name} (coinType ${currency.coinType})`
      );
      return <View style={{ width: size, height: size }} />;
    }
    return <IconComponent size={size} color={currency.color} />;
  }
}
