import styled from "styled-components/native";
import { ProviderIconSize, ProviderIconSizes } from "@ledgerhq/live-common/icons/providers/sizes";
import { View } from "react-native";

type StyledIconProps = {
  size: ProviderIconSize;
};

export const Contianer = styled(View)<StyledIconProps>`
  border-radius: 8px;
  width: ${({ size }) => ProviderIconSizes[size]}px;
  height: ${({ size }) => ProviderIconSizes[size]}px;
`;
