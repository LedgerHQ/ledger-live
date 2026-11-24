import { Box } from "@ledgerhq/react-ui";
import styled from "styled-components";

export const Container = styled(Box).attrs(() => ({
  display: "flex",
  grow: true,
  color: "neutral.c100",
}))<{
  shouldSpace?: boolean;
}>`
  align-items: ${p => p.alignItems || "center"};
  flex-direction: ${p => p.flexDirection || "column"};
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;
