import styled from "styled-components";
import Box from "~/renderer/components/Box";

export const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
}))`
  padding-right: 10px;
`;
export const TextSeparator = styled.span`
  height: 1em;
  margin: 0 4px;
  border: 1px solid;
  border-color: ${p => p.theme.colors.palette.text.shade20};
`;
