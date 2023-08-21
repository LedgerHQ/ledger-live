import styled from "styled-components";
import Box from "~/renderer/components/Box";

export const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))<{ shouldSpace?: boolean }>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;
