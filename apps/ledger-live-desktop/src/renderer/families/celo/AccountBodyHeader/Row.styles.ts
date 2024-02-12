import styled from "styled-components";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import { TableLine } from "./Header.styles";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;
export const Column = styled(TableLine).attrs<{ strong?: boolean; clickable?: boolean }>(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "palette.text.shade100" : "palette.text.shade80",
  fontSize: 3,
}))<{ strong?: boolean; clickable?: boolean }>`
  cursor: ${p => (p.clickable ? "pointer" : "cursor")};
  ${IconContainer} {
    color: ${p => p.theme.colors.palette.text.shade80};
    opacity: 1;
  }
  ${p =>
    p.clickable
      ? `
    &:hover {
      color: ${p.theme.colors.palette.primary.main};
    }
    `
      : ``}
`;
export const Ellipsis = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const ManageInfoIconWrapper = styled.div`
  margin-right: 20%;
`;
