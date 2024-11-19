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
  color: ${p =>
    p.active ? p.theme.colors.palette.primary.contrastText : p.theme.colors.palette.text.shade20};
  background: ${p =>
    p.active ? p.theme.colors.palette.primary.main : p.theme.colors.palette.action.disabled};
  padding: 0px 8px 2px 8px;
`;
