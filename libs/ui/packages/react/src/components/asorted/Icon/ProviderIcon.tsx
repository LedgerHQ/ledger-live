import * as providers from "@ledgerhq/icons-ui/react/_ProvidersLogos";
import React from "react";

export const sizes = {
  XXS: 16,
  XS: 24,
  S: 32,
  M: 40,
  L: 48,
  XL: 56,
};

export type ProviderSizes = keyof typeof sizes;

export type Props = {
  name: string;
  size?: ProviderSizes;
};

export const iconNames = Array.from(
  Object.keys(providers).reduce((set, rawKey) => {
    const key = rawKey
      .replace(/(.+)(Regular|Light|UltraLight|Thin|Medium)+$/g, "$1")
      .replace(/(.+)(Ultra)+$/g, "$1");
    if (!set.has(key)) set.add(key);
    return set;
  }, new Set<string>()),
);

const ProviderIcon = ({ name, size = "S" }: Props): JSX.Element | null => {
  const maybeIconName = `${name}`;
  if (maybeIconName in providers) {
    // @ts-expect-error FIXME I don't know how to make you happy ts
    const Component = providers[maybeIconName];
    return <Component size={sizes[size]} />;
  }
  return null;
};

export default ProviderIcon;
