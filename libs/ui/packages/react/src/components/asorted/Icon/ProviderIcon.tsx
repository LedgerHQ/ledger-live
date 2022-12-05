import * as providers from "@ledgerhq/icons-ui/react/Providers/index";
import * as providersBoxed from "@ledgerhq/icons-ui/react/ProvidersBoxed/index";

import React from "react";
import FlexBox from "../../layout/Flex";

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
  boxed?: boolean;
};

export const iconNames = Array.from(
  Object.keys(providers).reduce((set, rawKey) => {
    const key = rawKey
      .replace(/(.+)(Regular|Light|UltraLight|Thin|Medium)+$/g, "$1")
      .replace(/(.+)(Ultra)+$/g, "$1")
      .replace(/^_/, "");
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
  const key = Object.keys(object).find((key) => key.toLowerCase().replace(/^_/, "") === asLower);
  return key ? object[key] : null;
};

const ProviderIcon = ({ name, size = "S", boxed = false }: Props): JSX.Element | null => {
  const maybeIconName = `${name}`;

  if (boxed) {
    const BoxedComponent = getIconCaseInsensitive({
      search: maybeIconName,
      object: providersBoxed,
    }) as React.ElementType;
    return (
      <FlexBox width={sizes[size]} height={sizes[size]} borderRadius={8} overflow={"hidden"}>
        <BoxedComponent size={sizes[size]} />
      </FlexBox>
    );
  }
  const Component = getIconCaseInsensitive({
    search: maybeIconName,
    object: providers,
  }) as React.ElementType;
  if (Component) {
    return <Component size={sizes[size]} />;
  }
  return null;
};

export default ProviderIcon;
