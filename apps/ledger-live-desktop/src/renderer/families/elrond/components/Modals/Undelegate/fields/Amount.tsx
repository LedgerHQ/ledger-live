import React, { useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import TranslatedError from "~/renderer/components/TranslatedError";
import { Account, TransactionStatus } from "@ledgerhq/types-live";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
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
`;
const AmountButton = styled.button.attrs(() => ({
  type: "button",
}))`
  background-color: ${p =>
    p.error
      ? p.theme.colors.lightRed
      : p.active
      ? p.theme.colors.palette.primary.main
      : p.theme.colors.palette.action.hover};
  color: ${p =>
    p.error
      ? p.theme.colors.alertRed
      : p.active
      ? p.theme.colors.palette.primary.contrastText
      : p.theme.colors.palette.primary.main}!important;
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
const ErrorContainer = styled(Box)`
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
interface Props {
  amount: BigNumber;
  initialAmount: BigNumber;
  account: Account;
  label: JSX.Element;
  onChange: (amount: BigNumber) => void;
  status: TransactionStatus;
}
interface OptionType {
  value: BigNumber;
  label: string;
}
const AmountField = (props: Props) => {
  const {
    amount,
    initialAmount,
    account,
    onChange,
    status: { errors, warnings },
    label,
  } = props;
  const unit = getAccountUnit(account);
  const [focused, setFocused] = useState(false);
  const onAmountChange = (amount: BigNumber, unit?: Unit) => {
    onChange(amount, unit);
  };
  const options = useMemo(
    (): Array<OptionType> => [
      {
        label: "25%",
        value: initialAmount.multipliedBy(0.25).integerValue(),
      },
      {
        label: "50%",
        value: initialAmount.multipliedBy(0.5).integerValue(),
      },
      {
        label: "75%",
        value: initialAmount.multipliedBy(0.75).integerValue(),
      },
      {
        label: "100%",
        value: initialAmount,
      },
    ],
    [initialAmount],
  );
  const error = errors.amount || errors.unbonding;
  const warning: string | undefined = useMemo(() => focused && Object.values(warnings || {})[0], [
    focused,
    warnings,
  ]);
  return (
    <Box vertical>
      <Label>{label}</Label>
      <InputCurrency
        autoFocus={false}
        error={error}
        warning={warning}
        hideErrorMessage={true}
        containerProps={{
          grow: true,
        }}
        unit={unit}
        value={amount}
        onChange={onAmountChange}
        onChangeFocus={() => setFocused(true)}
        renderLeft={<InputLeft>{getAccountUnit(account).code}</InputLeft>}
        renderRight={
          <InputRight>
            {options.map(({ label, value }) => (
              <AmountButton
                active={value.eq(amount)}
                key={label}
                error={!!error}
                onClick={() => onAmountChange(value)}
              >
                {label}
              </AmountButton>
            ))}
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
export default AmountField;
