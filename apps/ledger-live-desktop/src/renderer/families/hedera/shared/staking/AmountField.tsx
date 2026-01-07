import noop from "lodash/noop";
import React from "react";
import styled, { useTheme } from "styled-components";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

interface Props {
  account: HederaAccount;
}

const AmountField = ({ account }: Props) => {
  const unit = useAccountUnit(account);
  const theme = useTheme();

  return (
    <Container>
      <InputCurrency
        disabled
        autoFocus={false}
        hideErrorMessage={true}
        containerProps={{
          grow: true,
          style: {
            backgroundColor: theme.colors.background.card,
          },
        }}
        defaultUnit={unit}
        value={account.spendableBalance}
        onChange={noop}
        renderLeft={<InputLeft>{unit.code}</InputLeft>}
        renderRight={
          <InputRight>
            <AmountButton error={false} disabled>
              100%
            </AmountButton>
          </InputRight>
        }
      />
    </Container>
  );
};

const Container = styled(Box)`
  margin: 0;
`;

const InputLeft = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "neutral.c70",
  fontSize: 4,
  justifyContent: "center",
  horizontal: true,
  pl: 3,
}))``;

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "neutral.c70",
  fontSize: 4,
  justifyContent: "center",
  horizontal: true,
}))`
  padding: ${p => p.theme.space[2]}px;
  pointer-events: none;
`;

const AmountButton = styled.button.attrs(() => ({
  type: "button",
}))<{
  error: boolean;
}>`
  background-color: ${p => (p.error ? p.theme.colors.lightRed : p.theme.colors.primary.c80)};
  color: ${p => (p.error ? p.theme.colors.alertRed : p.theme.colors.primary.c80)}!important;
  border: none;
  border-radius: 4px;
  padding: 0px ${p => p.theme.space[2]}px;
  margin: 0 2.5px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 200ms ease-out;
  &:hover {
    filter: contrast(2);
  }
`;

export default AmountField;
