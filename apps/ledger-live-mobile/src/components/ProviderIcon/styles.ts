import styled from "styled-components/native";
import { ProviderIconSizes } from "@ledgerhq/live-common/icons/providers/sizes";
import { View } from "react-native";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const Contianer = styled(View)`
  border-radius: 8px;
  width: ${({ size }: any) => ProviderIconSizes[size as keyof typeof ProviderIconSizes]}px;
  height: ${({ size }: any) => ProviderIconSizes[size as keyof typeof ProviderIconSizes]}px;
`;
/* eslint-enable @typescript-eslint/no-explicit-any */
