import styled from "styled-components";
import Box from "~/renderer/components/Box";

export const BoxWithBackground = styled(Box)`
  background-color: ${p => p.theme.colors.background.default};
  border-radius: 5px;
  padding: 0.5rem;
`;
