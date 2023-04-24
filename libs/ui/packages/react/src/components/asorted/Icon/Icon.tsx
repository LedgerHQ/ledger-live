import * as icons from "@ledgerhq/icons-ui/react";
import React from "react";

export type Props = {
  name: string;
  size?: number;
  weight?: "Medium";
  color?: string;
};

export const iconNames = Array.from(
  Object.keys(icons).reduce((set, rawKey) => {
    const key = rawKey.replace(/(.+)(Medium)+$/g, "$1");
    if (!set.has(key)) set.add(key);
    return set;
  }, new Set<string>()),
);

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
