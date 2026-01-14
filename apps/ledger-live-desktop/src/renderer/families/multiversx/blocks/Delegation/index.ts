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
  color: ${p => (p.strong ? "neutral.c100" : "neutral.c80")}
  cursor: ${p => (p.clickable ? "pointer" : "cursor")};
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
const Withdraw = styled.div`
  line-height: 1;
  cursor: pointer;
`;
const Divider = styled.div`
  width: 100%;
  height: 1px;
  margin-bottom: ${p => p.theme.space[1]}px;
  background-color: ${p => p.theme.colors.neutral.c40};
`;
export { TableLine, Column, Wrapper, Ellipsis, Divider, Withdraw };
