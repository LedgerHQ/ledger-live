import * as icons from "@ledgerhq/crypto-icons-ui/react";
import React from "react";
import { ensureContrast } from "../../../styles";
import { useTheme } from "styled-components";

export type Props = {
  name: string;
  size?: number;
  color?: string;
  backgroundColor?: string; // overrides background color to ensure contrast with icon color
};

export const iconNames = Array.from(
  Object.keys(icons).reduce((set, rawKey) => {
    const key = rawKey;
    if (!set.has(key)) set.add(key);
    return set;
  }, new Set<string>()),
);

const CryptoIcon = ({ name, size = 16, color, backgroundColor }: Props): JSX.Element | null => {
  const maybeIconName = `${name}`;
  const { colors } = useTheme();
  if (maybeIconName in icons) {
    // @ts-expect-error FIXME I don't know how to make you happy ts
    const Component = icons[maybeIconName];
    const defaultColor = Component.DefaultColor;
    const contrastedColor = ensureContrast(
      color || defaultColor,
      backgroundColor || colors.background.main,
    );
    return <Component size={size} color={contrastedColor} />;
  }
  return null;
};

export default CryptoIcon;
