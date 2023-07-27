import React from "react";
import { getProviderIconUrl } from "@ledgerhq/live-common/icons/providers/providers";
import { ProviderIconSize } from "@ledgerhq/live-common/icons/providers/sizes";
import * as Styles from "./styles";

export type Props = {
  name: string;
  size?: ProviderIconSize;
  boxed?: boolean;
  alt?: string;
};

const ProviderIcon = ({
  name,
  size = "S",
  boxed = false,
  alt = `${name} icon`,
}: Props): JSX.Element | null => {
  const iconUrl = getProviderIconUrl({ boxed, name });
  return <Styles.Icon src={iconUrl} size={size} alt={alt} />;
};

export default ProviderIcon;
