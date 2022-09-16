// @flow

import styled from "styled-components";
import Box from "~/renderer/components/Box";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

export const InputRight: ThemedComponent<{}> = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
}))`
  padding-right: 10px;
`;

export const TextSeparator: ThemedComponent<{}> = styled.span`
  height: 1em;
  margin: 0 4px;
  border: 1px solid;
  border-color: ${p => p.theme.colors.palette.text.shade20};
`;