import styled from "styled-components";
import Box from "~/renderer/components/Box";

export const Wrapper = styled(Box).attrs(() => ({
  p: 3,
}))`
  border-radius: 4px;
  justify-content: space-between;
  align-items: center;
`;
