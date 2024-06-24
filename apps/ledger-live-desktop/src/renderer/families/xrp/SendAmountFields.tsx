import React, { useCallback } from "react";
import invariant from "invariant";
import styled from "styled-components";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import InputCurrency from "~/renderer/components/InputCurrency";
import Box from "~/renderer/components/Box";
import GenericContainer from "~/renderer/components/FeesContainer";
import { track } from "~/renderer/analytics/segment";
import BigNumber from "bignumber.js";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: Record<string, unknown>;
};
const InputRight = styled(Box).attrs(() => ({
  ff: "Inter",
  color: "palette.text.shade80",
  fontSize: 4,
  justifyContent: "center",
  pr: 3,
}))``;
function FeesField({ account, transaction, onChange, status, trackProperties = {} }: Props) {
  invariant(transaction.family === "xrp", "FeeField: xrp family expected");
  const bridge = getAccountBridge(account);
  const onChangeFee = useCallback(
    (fee: BigNumber) => {
      track("button_clicked2", {
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
  const defaultUnit = useAccountUnit(account);
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
