// @flow

import React, { PureComponent } from "react";
import { View } from "react-native";

import type { Currency } from "@ledgerhq/currencies";

import * as icons from "../icons";

const iconsByCoinType = {
  "0": icons.btc,
  "1": icons.btc,
  "2": icons.ltc,
  "3": icons.dogecoin,
  "5": icons.dash
};

type typeIcon = React$ComponentType<{ size: number, color: string }>;

type Props = {
  currency: Currency,
  size: number
};

export function getIconByCoinType(coinType: number): typeIcon {
  return iconsByCoinType[coinType];
}

export default class CurrencyIcon extends PureComponent<Props> {
  render() {
    const { size, currency } = this.props;
    const IconComponent: typeIcon = getIconByCoinType(currency.coinType);
    if (!IconComponent) {
      console.warn(
        `No icon for currency ${currency.name} (coinType ${currency.coinType})`
      );
      return <View style={{ width: size, height: size }} />;
    }
    return <IconComponent size={size} color={currency.color} />;
  }
}
