import noop from "lodash/noop";
import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import TranslatedError from "~/renderer/components/TranslatedError";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { HederaAccount, TransactionStatus } from "@ledgerhq/live-common/families/hedera/types";

interface Props {
  account: HederaAccount;
  transaction: Transaction;
  status: TransactionStatus;
}

const AmountField = ({ account, status }: Props) => {
  const unit = useAccountUnit(account);

  const error = status.errors[Object.keys(status.errors)[0]];
  const warning = status.warnings[Object.keys(status.warnings)[0]];

  return (
    <Box>
      <InputCurrency
        disabled
        autoFocus={false}
        error={!!error}
        hideErrorMessage={true}
        containerProps={{
          grow: true,
        }}
        unit={unit}
        value={account.spendableBalance}
        onChange={noop}
        renderLeft={<InputLeft>{unit.code}</InputLeft>}
        renderRight={
          <InputRight>
            <AmountButton error={!!error} disabled>
              100%
            </AmountButton>
          </InputRight>
        }
      />
      <ErrorContainer hasError={error || warning}>
        {error ? (
          <ErrorDisplay id="input-error">
            <TranslatedError error={error} />
          </ErrorDisplay>
        ) : warning ? (
          <WarningDisplay id="input-warning">
            <TranslatedError error={warning} />
          </WarningDisplay>
        ) : null}
      </ErrorContainer>
    </Box>
  );
};

const InputLeft = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
  horizontal: true,
  pl: 3,
}))``;

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
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
  background-color: ${p =>
    p.error ? p.theme.colors.lightRed : p.theme.colors.palette.primary.main};
  color: ${p =>
    p.error ? p.theme.colors.alertRed : p.theme.colors.palette.primary.contrastText}!important;
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

const ErrorContainer = styled(Box)<{
  hasError: Error | undefined;
}>`
  margin-top: 0px;
  font-size: 12px;
  width: 100%;
  transition: all 0.4s ease-in-out;
  will-change: max-height;
  max-height: ${p => (p.hasError ? 60 : 0)}px;
  min-height: ${p => (p.hasError ? 20 : 0)}px;
`;

const ErrorDisplay = styled(Box)`
  color: ${p => p.theme.colors.pearl};
`;

const WarningDisplay = styled(Box)`
  color: ${p => p.theme.colors.warning};
`;

export default AmountField;
