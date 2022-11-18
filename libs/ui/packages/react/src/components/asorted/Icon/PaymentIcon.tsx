import * as paymentProviders from "@ledgerhq/icons-ui/react/_Payment/index";

import React from "react";

export const sizes = {
  XXS: 16,
  XS: 24,
  S: 32,
  M: 40,
  L: 48,
  XL: 56,
};

export type PaymentIconSizes = keyof typeof sizes;

export type Props = {
  name: string;
  size?: PaymentIconSizes;
};

export const iconNames = Array.from(
  Object.keys(paymentProviders).reduce((set, rawKey) => {
    const key = rawKey
      .replace(/(.+)(Regular|Light|UltraLight|Thin|Medium)+$/g, "$1")
      .replace(/(.+)(Ultra)+$/g, "$1");
    if (!set.has(key)) set.add(key);
    return set;
  }, new Set<string>()),
);

export type IconGetterProps = {
  search: string;
  object: Record<string, React.ReactNode>;
};

const getIconCaseInsensitive = ({ search, object }: IconGetterProps) => {
  const asLower = search.toLowerCase();
  const key = Object.keys(object).find((key) => key.toLowerCase() === asLower);
  return key ? object[key] : null;
};

const PaymentIcon = ({ name, size = "S" }: Props): JSX.Element | null => {
  const maybeIconName = `${name}`;

  const Component = getIconCaseInsensitive({
    search: maybeIconName,
    object: paymentProviders,
  }) as React.ElementType;
  if (Component) {
    return <Component size={sizes[size]} />;
  }
  return null;
};

export default PaymentIcon;
