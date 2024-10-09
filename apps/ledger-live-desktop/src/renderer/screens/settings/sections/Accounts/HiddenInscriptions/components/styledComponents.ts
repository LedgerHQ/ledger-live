import styled from "styled-components";
import Box from "~/renderer/components/Box";

export const IconContainer = styled.div`
  color: ${p => p.theme.colors.palette.text.shade60};
  text-align: center;
  &:hover {
    cursor: pointer;
    color: ${p => p.theme.colors.palette.text.shade40};
  }
`;
export const HiddenNftCollectionRowContainer = styled(Box).attrs({
  alignItems: "center",
  horizontal: true,
  flow: 1,
  py: 1,
})`
  margin: 0px;
  &:not(:last-child) {
    border-bottom: 1px solid ${p => p.theme.colors.palette.text.shade10};
  }
  padding: 14px 6px;
`;
export const Body = styled(Box)`
  &:not(:empty) {
    padding: 0 20px;
  }
`;

export const Show = styled(Box).attrs<{ visible?: boolean }>({})<{ visible?: boolean }>`
  transform: rotate(${p => (p.visible ? 0 : 270)}deg);
`;
