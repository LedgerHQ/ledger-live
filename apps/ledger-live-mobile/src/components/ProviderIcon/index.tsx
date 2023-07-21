import React from "react";
import { getProviderIconUrl } from "@ledgerhq/live-common/icons/providers/providers";
import { ProviderIconSize } from "@ledgerhq/live-common/icons/providers/sizes";
import * as Styles from "./styles";

export type Props = {
  name: string;
  size?: ProviderIconSize;
  boxed?: boolean;
};

const ProviderIcon = ({ name, size = "S", boxed = false }: Props): JSX.Element | null => {
  const iconUrl = getProviderIconUrl({ boxed, name });
  return <Styles.Icon uri={iconUrl} size={size} />;
};

export default ProviderIcon;
