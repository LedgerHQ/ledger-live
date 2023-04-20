import styled from "styled-components";
import { IconContainer } from "~/renderer/components/Delegation/ValidatorRow";
import { TableLine } from "./Header.styles";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
export const Wrapper: ThemedComponent<any> = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 16px 20px;
`;
export const Column: ThemedComponent<{
  clickable?: boolean;
}> = styled(TableLine).attrs(p => ({
  ff: "Inter|SemiBold",
  color: p.strong ? "palette.text.shade100" : "palette.text.shade80",
  fontSize: 3,
}))`
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
export const Ellipsis: ThemedComponent<{}> = styled.div`
  flex: 1;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
export const ManageInfoIconWrapper: ThemedComponent<{}> = styled.div`
  margin-right: 20%;
`;
