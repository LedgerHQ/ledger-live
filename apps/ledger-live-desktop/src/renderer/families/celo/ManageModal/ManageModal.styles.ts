import styled, { css } from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";

export const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: ${p => p.theme.colors.opacityDefault.c10};
  color: ${p => p.theme.colors.primary.c80};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${p => p.theme.space[2]}px;
`;
export const ManageButton = styled.button`
  min-height: 88px;
  padding: 16px;
  margin: 5px 0;
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;

  &:hover {
    border: 1px solid ${p => p.theme.colors.primary.c80};
  }

  ${p =>
    p.disabled
      ? css`
          pointer-events: none;
          cursor: auto;
          ${IconWrapper} {
            background-color: ${p.theme.colors.opacityDefault.c10};
            color: ${p.theme.colors.neutral.c40};
          }
          ${Title} {
            color: ${p.theme.colors.neutral.c70};
          }
          ${Description} {
            color: ${p.theme.colors.neutral.c40};
          }
        `
      : `
      cursor: pointer;
  `};
`;
export const InfoWrapper = styled(Box).attrs(() => ({
  flex: 1,
  ml: 3,
  textAlign: "start",
}))``;
export const Title = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 4,
}))``;
export const Description = styled(Text).attrs<{
  isPill?: boolean;
}>(({ isPill }) => ({
  ff: isPill ? "Inter|SemiBold" : "Inter|Regular",
  fontSize: isPill ? 2 : 3,
  color: "neutral.c70",
}))<{
  isPill?: boolean;
}>`
  ${p =>
    p.isPill
      ? `
    text-transform: uppercase;
  `
      : ""}
`;
