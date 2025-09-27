import * as icons from "@ledgerhq/icons-ui/nativeLegacy";
import React from "react";

export type Props = {
  name: string;
  size?: number;
  weight?: "Regular" | "Thin" | "Light" | "Medium" | "UltraLight";
  color?: string;
};

const Icon = ({
  name,
  size = 16,
  color = "currentColor",
  weight = "Medium",
}: Props): JSX.Element | null => {
  const maybeIconName = `${name}${weight}`;
  if (maybeIconName in icons) {
    // @ts-expect-error FIXME I don't know how to make you happy ts
    const Component = icons[maybeIconName];
    return <Component size={size} color={color} />;
  }
  return null;
};

export default Icon;
