import styled from "styled-components";
import { Text, Box } from "@ledgerhq/react-ui";
import { actionsIconOnlyThreshold } from "~/renderer/screens/market/components/Table";

export const CryptoCurrencyIconWrapper = styled.div`
  height: 32px;
  width: 32px;
  position: relative;
  border-radius: 32px;
  overflow: hidden;
  img {
    object-fit: cover;
  }
`;

export const CryptoNameContainer = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 12px;
`;

export const EllipsisText = styled(Text)`
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TooltipContainer = styled(Box)`
  background-color: ${({ theme }) => theme.colors.neutral.c100};
  padding: 10px;
  border-radius: 4px;
  display: flex;
  gap: 8px;
`;

export const ActionsFullWidth = styled.div`
  display: flex;
  gap: 8px;
  @media (max-width: ${actionsIconOnlyThreshold}px) {
    display: none;
  }
`;

export const ActionsIconOnly = styled.div`
  display: none;
  gap: 8px;
  @media (max-width: ${actionsIconOnlyThreshold}px) {
    display: flex;
  }
`;
