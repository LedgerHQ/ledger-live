import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

export const StyledIconContainer = styled(Flex).attrs({
  width: 32,
  height: 32,
  bg: "neutral.c30",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
})`
  border-radius: 32px;
  overflow: hidden;
`;
