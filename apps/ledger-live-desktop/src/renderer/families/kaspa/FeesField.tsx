import React, { useRef } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/kaspa/types";
import InputCurrency from "~/renderer/components/InputCurrency";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import BigNumber from "bignumber.js";

type Props = {
  account: Account;
  onChange: (feePerByte: BigNumber) => void;
  transaction: Transaction;
  status: TransactionStatus;
};
const InputRight = styled(Box).attrs(() => ({
  ff: "Inter",
  color: "neutral.c80",
  fontSize: 4,
  justifyContent: "center",
  pr: 3,
}))``;

export const FeesField = ({ account, transaction, onChange, status }: Props) => {
  const inputRef = useRef();
  const { units } = account.currency;
  const sompis = units[units.length - 1];
  const { errors } = status;
  const { feePerByte: feePerByteError } = errors;

  const onInputChange = (feePerByte: BigNumber) => onChange(feePerByte);
  return (
    <Box horizontal flow={5}>
      <Label
        style={{
          width: "200px",
        }}
      >
        <Trans i18nKey="fees.feesAmount" />
      </Label>
      <InputCurrency
        defaultUnit={sompis}
        units={units}
        ref={inputRef}
        containerProps={{
          grow: true,
        }}
        onChange={onInputChange}
        loading={false}
        value={transaction.customFeeRate || BigNumber(1)}
        error={!!feePerByteError && feePerByteError}
        renderRight={
          <InputRight>
            <Trans
              i18nKey="send.steps.details.unitPerByte"
              values={{
                unit: sompis.code,
              }}
            />
          </InputRight>
        }
        allowZero
        data-test-id="currency-textbox"
      />
    </Box>
  );
};
