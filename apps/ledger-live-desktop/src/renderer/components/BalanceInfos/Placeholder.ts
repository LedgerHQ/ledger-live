import styled from "styled-components";

export const PlaceholderLine = styled.div<{
  dark?: boolean;
  width: number;
  height?: number;
}>`
  background-color: ${p => (p.dark ? p.theme.colors.neutral.c80 : p.theme.colors.neutral.c40)};
  width: ${p => p.width}px;
  height: ${p => p.height || 10}px;
  border-radius: 5px;
  margin: 5px 0;
`;
