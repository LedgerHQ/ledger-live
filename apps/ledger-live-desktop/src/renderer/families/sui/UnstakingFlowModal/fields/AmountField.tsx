import React, { useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import { Account } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import { TransactionStatus } from "@ledgerhq/live-common/families/sui/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = {
  readonly amount: BigNumber;
  readonly available: BigNumber;
  readonly account: Account;
  readonly status: TransactionStatus;
  readonly onChange: (amount: BigNumber) => void;
};
export default function AmountField({
  amount,
  account,
  onChange,
  available,
  status: { errors, warnings },
}: Props) {
  const unit = useAccountUnit(account);
  const [focused, setFocused] = useState(false);
  const options = [
    {
      label: "25%",
      value: available.multipliedBy(0.25).integerValue(),
    },
    {
      label: "50%",
      value: available.multipliedBy(0.5).integerValue(),
    },
    {
      label: "75%",
      value: available.multipliedBy(0.75).integerValue(),
    },
    {
      label: "100%",
      value: available,
    },
  ];

  const error = errors.amount;
  const warning = useMemo(() => focused && Object.values(warnings || {})[0], [focused, warnings]);

  return (
    <Box my={2}>
      <InputCurrency
        autoFocus={false}
        error={error}
        warning={warning}
        containerProps={{
          grow: true,
        }}
        unit={unit}
        value={amount}
        onChange={onChange}
        onChangeFocus={() => setFocused(true)}
        renderLeft={<InputLeft>{unit.code}</InputLeft>}
        renderRight={
          <InputRight>
            {options.map(({ label, value }) => (
              <AmountButton
                active={value.eq(amount)}
                key={label}
                error={!!error}
                onClick={() => onChange(value)}
              >
                {label}
              </AmountButton>
            ))}
          </InputRight>
        }
      />
    </Box>
  );
}
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
`;
const getBackgroundColor = (p: {
  error: boolean;
  active: boolean;
  theme: import("styled-components").DefaultTheme;
}) => {
  if (p.error) {
    return p.theme.colors.lightRed;
  }
  if (p.active) {
    return p.theme.colors.primary.c80;
  }
  return p.theme.colors.opacityDefault.c10;
};

const getTextColor = (p: {
  error: boolean;
  active: boolean;
  theme: import("styled-components").DefaultTheme;
}) => {
  if (p.error) {
    return p.theme.colors.alertRed;
  }
  if (p.active) {
    return p.theme.colors.neutral.c00;
  }
  return p.theme.colors.primary.c80;
};

const AmountButton = styled.button.attrs(() => ({
  type: "button",
}))<{
  error: boolean;
  active: boolean;
}>`
  background-color: ${p => getBackgroundColor(p)};
  color: ${p => getTextColor(p)}!important;
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
