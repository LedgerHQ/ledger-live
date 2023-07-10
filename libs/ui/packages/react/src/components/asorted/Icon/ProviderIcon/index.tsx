import React from "react";
import { Provider, isProviderIconName, getProviderIconUrl } from "@ledgerhq/ui-shared";
import * as Styles from "./styles";

export type Props = {
  name: Provider | string;
  size?: Styles.IconSizes;
  boxed?: boolean;
  alt?: string;
};

const ProviderIcon = ({
  name,
  size = "S",
  boxed = false,
  alt = `${name} icon`,
}: Props): JSX.Element | null => {
  const isValidIcon = isProviderIconName(name);
  if (!isValidIcon) return null;
  const iconUrl = getProviderIconUrl({ boxed, name });
  return <Styles.Icon src={iconUrl} size={size} alt={alt} />;
};

export default ProviderIcon;
