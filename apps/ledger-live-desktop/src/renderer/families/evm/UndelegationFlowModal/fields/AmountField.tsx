import React, { useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";
import type { StakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import type { TransactionStatusCommon } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Label from "~/renderer/components/Label";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = Readonly<{
  amount: BigNumber;
  delegatedAmount: BigNumber;
  account: StakingAccount;
  status: TransactionStatusCommon;
  onChange: (amount: BigNumber) => void;
  label: React.ReactNode;
}>;

export default function AmountField({
  amount,
  delegatedAmount,
  account,
  onChange,
  status: { errors, warnings },
  label,
}: Props) {
  const unit = useAccountUnit(account);
  const [focused, setFocused] = useState(false);

  const options = useMemo(
    () => [
      { label: "25%", value: delegatedAmount.multipliedBy(0.25).integerValue() },
      { label: "50%", value: delegatedAmount.multipliedBy(0.5).integerValue() },
      { label: "75%", value: delegatedAmount.multipliedBy(0.75).integerValue() },
      { label: "100%", value: delegatedAmount },
    ],
    [delegatedAmount],
  );

  // Forward only errors that make sense here: `amount` and the generic-coin-framework `unbonding` bucket,
  // while skipping validator-level (`valAddress`) which is surfaced at the row selection step.
  const error = errors?.amount || errors?.unbonding;
  const warning = useMemo(() => focused && Object.values(warnings || {})[0], [focused, warnings]);

  return (
    <Box my={2}>
      <Label>{label}</Label>
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

const AmountButton = styled.button.attrs<{
  error: boolean;
  active: boolean;
}>(() => ({
  type: "button",
}))<{
  error: boolean;
  active: boolean;
}>`
  background-color: ${p =>
    p.error
      ? p.theme.colors.lightRed
      : p.active
        ? p.theme.colors.primary.c80
        : p.theme.colors.opacityDefault.c10};
  color: ${p =>
    p.error
      ? p.theme.colors.alertRed
      : p.active
        ? p.theme.colors.neutral.c00
        : p.theme.colors.primary.c80}!important;
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
