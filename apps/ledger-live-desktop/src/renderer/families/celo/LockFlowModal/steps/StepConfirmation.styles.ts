import styled from "styled-components";
import Box from "~/renderer/components/Box";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
export const Container: ThemedComponent<{
  shouldSpace?: boolean;
}> = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
  min-height: 220px;
`;
