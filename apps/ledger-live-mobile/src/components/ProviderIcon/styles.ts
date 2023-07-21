import styled from "styled-components/native";
import { SvgUri } from "react-native-svg";
import { ProviderIconSize, ProviderIconSizes } from "@ledgerhq/live-common/icons/providers/sizes";

type StyledIconProps = {
  size: ProviderIconSize;
};

export const Icon = styled(SvgUri)<StyledIconProps>`
  border-radius: 8px;
  width: ${({ size }) => ProviderIconSizes[size]}px;
  height: ${({ size }) => ProviderIconSizes[size]}px;
`;
