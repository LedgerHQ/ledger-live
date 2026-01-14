import styled from "styled-components";

export const ChipContainer = styled.div`
  display: inline-flex;
  cursor: pointer;
  width: max-content;
  overflow: hidden;
  border-radius: 10px;
  margin: 0px;
`;

export const Chip = styled.div<{
  active: boolean;
}>`
  color: ${p => (p.active ? p.theme.colors.neutral.c00 : p.theme.colors.neutral.c40)};
  background: ${p => (p.active ? p.theme.colors.primary.c80 : p.theme.colors.opacityDefault.c10)};
  padding: 0px 8px 2px 8px;
`;
