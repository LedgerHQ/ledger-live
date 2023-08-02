import React from "react";
import { getProviderIconUrl } from "@ledgerhq/live-common/icons/providers/providers";
import { ProviderIconSize } from "@ledgerhq/live-common/icons/providers/sizes";
import * as Styles from "./styles";
import { SvgUri } from "react-native-svg";

export type Props = {
  name: string;
  size?: ProviderIconSize;
  boxed?: boolean;
};

const ProviderIcon = ({ name, size = "S", boxed = true }: Props): JSX.Element | null => {
  const iconUrl = getProviderIconUrl({ boxed, name });
  return (
    <Styles.Contianer size={size}>
      <SvgUri uri={iconUrl} />
    </Styles.Contianer>
  );
};

export default ProviderIcon;
