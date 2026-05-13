import React from "react";
import { SvgUri } from "react-native-svg";
import { getProviderIconUrl } from "@ledgerhq/live-common/icons/providers/providers";

type ProviderIconProps = Readonly<{
  name: string;
  size?: number;
}>;

export function ProviderIcon({ name, size = 16 }: ProviderIconProps) {
  return <SvgUri width={size} height={size} uri={getProviderIconUrl({ name, boxed: true })} />;
}
