import styled from "styled-components";
import Box from "~/renderer/components/Box";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
export const Wrapper: ThemedComponent<{}> = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
