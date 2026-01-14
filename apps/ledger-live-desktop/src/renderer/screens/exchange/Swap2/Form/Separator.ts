import styled from "styled-components";

export const Separator = styled.div<{ noMargin?: boolean }>`
  border-top: 1px solid ${p => p.theme.colors.neutral.c40};
  ${p => (p.noMargin ? "" : "margin-top: 24px; margin-bottom: 24px;")}
`;
