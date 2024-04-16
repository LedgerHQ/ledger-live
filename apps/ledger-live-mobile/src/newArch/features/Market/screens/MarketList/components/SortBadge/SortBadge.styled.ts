import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

export const StyledBadge = styled(Flex).attrs((p: { bg?: string }) => ({
  bg: p.bg ?? "neutral.c30",
  flexDirection: "row",
  mx: "6px",
  px: 4,
  py: 1,
  justifyContent: "center",
  alignItems: "center",
  height: 32,
}))`
  border-radius: 32px;
`;

export const StyledCheckIconContainer = styled(Flex).attrs({
  bg: "primary.c80",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  height: 24,
  width: 24,
})`
  border-radius: 24px;
`;
