import styled from "styled-components";
import Box from "~/renderer/components/Box/Box";

const TableLine = styled(Box).attrs(() => ({
  ff: "Inter|SemiBold",
  color: "neutral.c70",
  horizontal: true,
  alignItems: "center",
  justifyContent: "flex-start",
  fontSize: 3,
  flex: 1.125,
  pr: 2,
}))`
  box-sizing: border-box;
  &:last-child {
    justify-content: flex-end;
    flex: 0.5;
    text-align: right;
    white-space: nowrap;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;

const Column = styled(TableLine).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 3,
}))<{ strong?: boolean; clickable?: boolean }>`
  color: ${p => (p.strong ? p.theme.colors.neutral.c100 : p.theme.colors.neutral.c80)};
  cursor: ${p => (p.clickable ? "pointer" : "inherit")};
  ${p =>
    p.clickable
      ? `
    &:hover {
      color: ${p.theme.colors.primary.c80};
    }
    `
      : ``}
`;

const Ellipsis = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** The validator address under its name: the device shows the address, so this is what the user checks against. */
const SubLabel = styled.div`
  font-size: 11px;
  font-family: "Inter";
  font-weight: 400;
  color: ${p => p.theme.colors.neutral.c70};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Claim = styled.div`
  line-height: 1;
  cursor: pointer;
  color: ${p => p.theme.colors.primary.c80};
`;

export { TableLine, Column, Wrapper, Ellipsis, SubLabel, Claim };
