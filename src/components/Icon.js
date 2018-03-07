// @flow

import React from "react";
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
  type: number,
  size: number,
  color: string
};

export function getIconByCoinType(coinType: number): typeIcon {
  return iconsByCoinType[coinType];
}

export default function IconComponent({ type, size, color }: Props) {
  const IconComponent: typeIcon = getIconByCoinType(type);

  if (!IconComponent) {
    console.warn(`No icon for cointype ${type}`);
    return null;
  }

  return <IconComponent size={size} color={color} />;
}
