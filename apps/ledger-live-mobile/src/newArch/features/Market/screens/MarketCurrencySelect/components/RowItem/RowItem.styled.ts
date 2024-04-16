import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

export const StyledCheckIconContainer = styled(Flex).attrs({
  bg: "primary.c80",
  flexDirection: "row",
  justifyContent: " center",
  alignItems: "center",
  height: 24,
  width: 24,
})`
  border-radius: 24px;
`;
