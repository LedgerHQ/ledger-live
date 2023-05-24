import styled from "styled-components";

export const PlaceholderLine = styled.div<{
  width: number;
  height?: number;
  dark?: boolean;
}>`
  background-color: ${p =>
    p.dark ? p.theme.colors.palette.text.shade80 : p.theme.colors.palette.text.shade20};
  width: ${p => p.width}px;
  height: ${p => p.height || 10}px;
  border-radius: 5px;
  margin: 5px 0;
`;
