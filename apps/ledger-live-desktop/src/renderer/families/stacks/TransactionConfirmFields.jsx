// @flow

import invariant from "invariant";
import React from "react";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import Text from "~/renderer/components/Text";
import type { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

const addressStyle = {
  wordBreak: "break-all",
  textAlign: "right",
  maxWidth: "70%",
};

const StacksField = ({
  transaction,
  field,
}: {
  transaction: Transaction,
  field: DeviceTransactionField,
}) => {
  invariant(transaction.family === "stacks", "stacks transaction");

  return (
    <TransactionConfirmField label={field.label}>
      <Text style={addressStyle} ml={1} ff="Inter|Medium" color="palette.text.shade80" fontSize={3}>
        {field.value}
      </Text>
    </TransactionConfirmField>
  );
};

const fieldComponents = {
  "stacks.memo": StacksField,
};

export default {
  fieldComponents,
};
