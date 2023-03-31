import styled from "styled-components";
import Text from "~/renderer/components/Text";
export const RowContainer = styled.div`
  display: flex;
  padding: 0px 40px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.palette.background.default};
  }

  &:active {
    color: ${({ theme }) => theme.colors.palette.text.shade80};
  }
`;
export const RowInnerContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 14px 12px;
`;
export const CurrencyLabel = styled(Text).attrs(() => ({
  color: "palette.text.shade60",
  ff: "Inter|SemiBold",
  fontSize: 2,
}))`
  padding: 0 6px;
  height: 24px;
  line-height: 24px;
  border-color: currentColor;
  border-width: 1px;
  border-style: solid;
  border-radius: 4px;
  text-align: center;
  flex: 0 0 auto;
  box-sizing: content-box;
`;
