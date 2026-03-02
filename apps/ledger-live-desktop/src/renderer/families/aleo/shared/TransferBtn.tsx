import React from "react";
import styled from "styled-components";
import { rgba } from "@ledgerhq/react-ui/styles/helpers";
import { Flex } from "@ledgerhq/react-ui";

type ButtonState = {
  checked: boolean;
  disabled?: boolean;
};

const BalanceLabel = styled.p<ButtonState>`
  font-size: 13px;
  font-weight: 700;
  color: ${p =>
    p.disabled
      ? p.theme.colors.neutral.c80
      : p.checked
        ? p.theme.colors.primary.c90
        : p.theme.colors.neutral.c100};
  margin: 0;
`;

const BalanceValue = styled.p<ButtonState>`
  font-size: 13px;
  font-weight: 500;
  color: ${p =>
    p.disabled
      ? p.theme.colors.neutral.c80
      : p.checked
        ? p.theme.colors.primary.c90
        : p.theme.colors.neutral.c100};
`;

const LastUpdateText = styled.p`
  font-size: 13px;
  color: ${p => p.theme.colors.neutral.c70};
  margin: 0;
`;

const StyledButton = styled.button<ButtonState>`
  flex: 1;
  cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  display: flex;
  flex-direction: column;
  text-align: left;
  background-color: ${p => (p.checked ? p.theme.colors.primary.c20 : "transparent")};
  border: 1px solid ${p => (p.checked ? p.theme.colors.primary.c50 : p.theme.colors.neutral.c40)};
  border-radius: ${p => `${p.theme.radii[2]}px`};
  padding: 20px 15px;

  &:hover {
    border-color: ${p => (p.disabled || p.checked ? "" : p.theme.colors.primary.c80)};
  }

  &:focus {
    outline: none;
    box-shadow: 0px 0px 0px 4px ${p => rgba(p.theme.colors.primary.c60, 0.48)};
  }
`;

export interface TransferBtnProps {
  isSelfTransfer: boolean;
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
  balanceType: "Public" | "Private";
  balance: string | null;
  lastSyncDate: string | null;
  lastSyncTime: string | null;
}

export const TransferBtn = ({
  isSelfTransfer,
  checked,
  onClick,
  balanceType,
  disabled,
  balance,
  lastSyncDate,
  lastSyncTime,
}: TransferBtnProps) => {
  const standardContent = (
    <>
      <BalanceLabel checked={checked} disabled={disabled}>
        {balanceType} balance
      </BalanceLabel>
      <BalanceValue className="mt-6" checked={checked} disabled={disabled}>
        {balance ?? "-"}
      </BalanceValue>
      {lastSyncDate && <LastUpdateText>Last update: {lastSyncDate}</LastUpdateText>}
      {lastSyncTime && <LastUpdateText>({lastSyncTime})</LastUpdateText>}
    </>
  );

  const selfTransferContent = (
    <Flex alignItems="center" justifyContent="space-between">
      <Flex flexDirection="column">
        <BalanceLabel checked={checked} disabled={disabled}>
          {balanceType} balance
        </BalanceLabel>
        {lastSyncDate && lastSyncTime && (
          <LastUpdateText>
            Last update: {lastSyncDate} ({lastSyncTime})
          </LastUpdateText>
        )}
      </Flex>
      <Flex flexDirection="column">
        <BalanceValue checked={checked} disabled={disabled}>
          {balance ?? "-"}
        </BalanceValue>
      </Flex>
    </Flex>
  );

  return (
    <StyledButton disabled={disabled} checked={checked} type="button" onClick={onClick}>
      {isSelfTransfer ? selfTransferContent : standardContent}
    </StyledButton>
  );
};
