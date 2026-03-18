import React from "react";
import styled from "styled-components";
import { rgba } from "@ledgerhq/react-ui/styles/helpers";
import { Flex } from "@ledgerhq/react-ui";
import { Trans } from "react-i18next";

interface ButtonState {
  $checked?: boolean;
  disabled?: boolean;
}

interface TextState {
  $checked?: boolean;
  $disabled?: boolean;
}

const BalanceLabel = styled.p<TextState>`
  font-size: 13px;
  font-weight: 600;
  color: ${p => {
    if (p.$disabled) return p.theme.colors.neutral.c100;
    return p.$checked ? p.theme.colors.primary.c90 : p.theme.colors.neutral.c100;
  }};
  margin: 0;
`;

const BalanceValue = styled.p<TextState>`
  font-size: 12px;
  font-weight: 500;
  color: ${p => {
    if (p.$disabled) return p.theme.colors.neutral.c80;
    return p.$checked ? p.theme.colors.primary.c90 : p.theme.colors.neutral.c100;
  }};
`;

const LastUpdateText = styled.p`
  font-size: 13px;
  color: ${p => p.theme.colors.neutral.c70};
  margin-top: 4px;
`;

const LastSyncText = styled(LastUpdateText)`
  margin-top: 0;
`;

export const StyledButton = styled.button<ButtonState>`
  flex: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  text-align: left;
  background-color: ${p => (p.$checked ? rgba(p.theme.colors.primary.c20, 0.7) : "transparent")};
  border: 1px solid ${p => (p.$checked ? p.theme.colors.primary.c50 : p.theme.colors.neutral.c40)};
  border-radius: ${p => `${p.theme.radii[2]}px`};
  pointer-events: ${p => (p.disabled ? "none" : "auto")};
  padding: 15px;

  &:hover {
    border-color: ${p => {
      if (p.disabled) {
        return p.$checked ? p.theme.colors.primary.c50 : p.theme.colors.neutral.c40;
      }
      return p.theme.colors.primary.c50;
    }};
    background-color: ${p =>
      p.$checked ? p.theme.colors.primary.c20 : rgba(p.theme.colors.primary.c20, 0.35)};
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary.c70};
    outline-offset: 2px;
  }
`;

export interface BalanceOptionProps {
  isSelfTransfer?: boolean;
  checked: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  balance: string | null;
  lastSyncDate?: string;
  lastSyncTime?: string;
}

export const BalanceOption = ({
  isSelfTransfer,
  checked,
  onClick,
  label,
  disabled,
  balance,
  lastSyncDate,
  lastSyncTime,
}: BalanceOptionProps) => {
  return (
    <StyledButton disabled={disabled} $checked={checked} type="button" onClick={onClick}>
      {isSelfTransfer ? (
        <Flex alignItems="center" justifyContent="space-between">
          <Flex flexDirection="column">
            <BalanceLabel $checked={checked} $disabled={disabled}>
              {label}
            </BalanceLabel>
            {lastSyncDate && lastSyncTime && (
              <LastUpdateText>
                <Trans i18nKey="aleo.shared.balanceSelector.lastUpdate" />: {lastSyncDate} (
                {lastSyncTime})
              </LastUpdateText>
            )}
          </Flex>
          <Flex flexDirection="column">
            <BalanceValue $checked={checked} $disabled={disabled}>
              {balance ?? "-"}
            </BalanceValue>
          </Flex>
        </Flex>
      ) : (
        <>
          <BalanceLabel $checked={checked} $disabled={disabled}>
            {label}
          </BalanceLabel>
          <BalanceValue className="mt-6" $checked={checked} $disabled={disabled}>
            {balance ?? "-"}
          </BalanceValue>
          {lastSyncDate && (
            <LastUpdateText>
              <Trans i18nKey="aleo.shared.balanceSelector.lastUpdate" />: {lastSyncDate}
            </LastUpdateText>
          )}
          {lastSyncTime && <LastSyncText>({lastSyncTime})</LastSyncText>}
        </>
      )}
    </StyledButton>
  );
};
