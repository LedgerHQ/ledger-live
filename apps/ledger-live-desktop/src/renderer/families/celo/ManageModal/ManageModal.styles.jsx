// @flow

import styled, { css } from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

export const IconWrapper: ThemedComponent<{}> = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: ${p => p.theme.colors.palette.action.hover};
  color: ${p => p.theme.colors.palette.primary.main};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${p => p.theme.space[2]}px;
`;

export const ManageButton: ThemedComponent<{}> = styled.button`
  min-height: 88px;
  padding: 16px;
  margin: 5px 0;
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.palette.divider};
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;

  &:hover {
    border: 1px solid ${p => p.theme.colors.palette.primary.main};
  }

  ${p =>
    p.disabled
      ? css`
          pointer-events: none;
          cursor: auto;
          ${IconWrapper} {
            background-color: ${p.theme.colors.palette.action.active};
            color: ${p.theme.colors.palette.text.shade20};
          }
          ${Title} {
            color: ${p.theme.colors.palette.text.shade50};
          }
          ${Description} {
            color: ${p.theme.colors.palette.text.shade30};
          }
        `
      : `
      cursor: pointer;
  `};
`;

export const InfoWrapper: ThemedComponent<{}> = styled(Box).attrs(() => ({
  vertical: true,
  flex: 1,
  ml: 3,
  textAlign: "start",
}))``;

export const Title: ThemedComponent<{}> = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 4,
}))``;

export const Description: ThemedComponent<{ isPill?: boolean }> = styled(Text).attrs(
  ({ isPill }) => ({
    ff: isPill ? "Inter|SemiBold" : "Inter|Regular",
    fontSize: isPill ? 2 : 3,
    color: "palette.text.shade60",
  }),
)`
  ${p =>
    p.isPill
      ? `
    text-transform: uppercase;
  `
      : ""}
`;
