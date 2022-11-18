import * as flags from "@ledgerhq/icons-ui/react/Flags/index";
import React from "react";

export const sizes = {
  XXS: 16,
  XS: 24,
  S: 32,
  M: 40,
  L: 48,
  XL: 56,
};

export type FlagsSizes = keyof typeof sizes;

export type Props = {
  name: string;
  size?: FlagsSizes;
};

export const iconNames = Array.from(
  Object.keys(flags).reduce((set, rawKey) => {
    const key = rawKey
      .replace(/(.+)(Regular|Light|UltraLight|Thin|Medium)+$/g, "$1")
      .replace(/(.+)(Ultra)+$/g, "$1");
    if (!set.has(key)) set.add(key);
    return set;
  }, new Set<string>()),
);

const FlagIcon = ({ name, size = "S" }: Props): JSX.Element | null => {
  const maybeIconName = `${name}`;
  if (maybeIconName in flags) {
    // @ts-expect-error FIXME I don't know how to make you happy ts
    const Component = flags[maybeIconName];
    return <Component size={sizes[size]} />;
  }
  return null;
};

export default FlagIcon;
