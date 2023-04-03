import React, { useCallback } from "react";
import invariant from "invariant";
import styled from "styled-components";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import InputCurrency from "~/renderer/components/InputCurrency";
import Box from "~/renderer/components/Box";
import GenericContainer from "~/renderer/components/FeesContainer";
import { track } from "~/renderer/analytics/segment";
type Props = {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
};
const InputRight = styled(Box).attrs(() => ({
  ff: "Inter",
  color: "palette.text.shade80",
  fontSize: 4,
  justifyContent: "center",
  pr: 3,
}))``;
function FeesField({ account, transaction, onChange, status, trackProperties = {} }: Props) {
  invariant(transaction.family === "ripple", "FeeField: ripple family expected");
  const bridge = getAccountBridge(account);
  const onChangeFee = useCallback(
    fee => {
      track("button_clicked", {
        ...trackProperties,
        fee,
        button: "input",
      });
      onChange(
        bridge.updateTransaction(transaction, {
          fee,
        }),
      );
    },
    [trackProperties, onChange, bridge, transaction],
  );
  const { errors } = status;
  const { fee: feeError } = errors;
  const { fee } = transaction;
  const defaultUnit = getAccountUnit(account);
  return (
    <GenericContainer>
      <InputCurrency
        defaultUnit={defaultUnit}
        renderRight={<InputRight>{defaultUnit.code}</InputRight>}
        containerProps={{
          grow: true,
        }}
        loading={!feeError && !fee}
        error={feeError}
        value={fee}
        onChange={onChangeFee}
      />
    </GenericContainer>
  );
}
export default {
  component: FeesField,
  fields: ["fee"],
};
