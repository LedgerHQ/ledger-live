import React from "react";
import { getProviderIconUrl } from "@ledgerhq/live-common/icons/providers/providers";
import { ProviderIconSize } from "@ledgerhq/live-common/icons/providers/sizes";
import * as Styles from "./styles";

export type Props = {
  name: string;
  size?: ProviderIconSize;
  boxed?: boolean;
  alt?: string;
  borderRadius?: number;
};

const ProviderIcon = ({
  name,
  size = "S",
  boxed = true,
  alt = `${name} icon`,
  borderRadius = 8,
}: Props): React.JSX.Element | null => {
  const iconUrl = getProviderIconUrl({ boxed, name });
  return <Styles.Icon src={iconUrl} size={size} alt={alt} $borderRadius={borderRadius} />;
};

export default ProviderIcon;
