import invariant from "invariant";
import React, { useRef, useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/bitcoin/types";
import { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import InputCurrency from "~/renderer/components/InputCurrency";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import BigNumber from "bignumber.js";
type Props = {
  account: Account;
  transaction: Transaction;
  onChange: (a: Transaction) => void;
  status: TransactionStatus;
};
const InputRight = styled(Box).attrs(() => ({
  ff: "Inter",
  color: "palette.text.shade80",
  fontSize: 4,
  justifyContent: "center",
  pr: 3,
}))``;
export const FeesField = ({ transaction, account, onChange, status }: Props) => {
  invariant(transaction.family === "bitcoin", "FeeField: bitcoin family expected");
  const bridge = getAccountBridge(account);
  const { feePerByte, networkInfo } = transaction;
  const inputRef = useRef();
  const { units } = account.currency;
  const satoshi = units[units.length - 1];
  const onSelectChange = useCallback(
    (item: { feePerByte: BigNumber }) => {
      onChange(
        bridge.updateTransaction(transaction, {
          feePerByte: item.feePerByte,
          feesStrategy: null,
        }),
      );
    },
    [onChange, transaction, bridge],
  );
  const onInputChange = (feePerByte: BigNumber) =>
    onSelectChange({
      feePerByte,
    });
  const { errors } = status;
  const { feePerByte: feePerByteError } = errors;
  const showError = networkInfo && feePerByteError;
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
        defaultUnit={satoshi}
        units={units}
        ref={inputRef}
        containerProps={{
          grow: true,
        }}
        value={feePerByte}
        onChange={onInputChange}
        loading={!feePerByte}
        error={showError && feePerByteError}
        renderRight={
          <InputRight>
            <Trans
              i18nKey="send.steps.details.unitVByte"
              values={{
                unit: satoshi.code,
              }}
            />
          </InputRight>
        }
        allowZero
        data-testid="currency-textbox"
      />
    </Box>
  );
};
