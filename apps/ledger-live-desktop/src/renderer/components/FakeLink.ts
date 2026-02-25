import styled from "styled-components";
import Box from "~/renderer/components/Box";
import get from "lodash/get";
import { darken, lighten } from "~/renderer/styles/helpers";

export default styled(Box).attrs(p => ({
  cursor: "pointer",
  color: p.color || "wallet",
  horizontal: true,
  className: "fake-link",
}))<{ underline?: boolean; color?: string }>`
  align-items: center;
  display: inline-flex;
  text-decoration: ${p => (p.underline ? "underline" : "none")};
  &:hover {
    text-decoration: underline;
    color: ${p => {
      const resolvedColor = p.color
        ? get(p.theme.colors, p.color, p.color)
        : p.theme.colors.primary.c80;
      return lighten(resolvedColor, 0.05);
    }};
  }

  &:active {
    color: ${p => {
      const resolvedColor = p.color
        ? get(p.theme.colors, p.color, p.color)
        : p.theme.colors.primary.c80;
      return darken(resolvedColor, 0.1);
    }};
  }
`;
