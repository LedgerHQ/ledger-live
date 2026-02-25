import styled from "styled-components";
import { Text, Box } from "@ledgerhq/react-ui";

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

export const EllipsisText = styled(Text)`
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
