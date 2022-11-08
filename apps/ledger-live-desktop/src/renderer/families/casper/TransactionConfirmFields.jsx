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

const CasperField = ({
  transaction,
  field,
}: {
  transaction: Transaction,
  field: DeviceTransactionField,
}) => {
  invariant(transaction.family === "casper", "casper transaction");

  return (
    <TransactionConfirmField label={field.label}>
      <Text style={addressStyle} ml={1} ff="Inter|Medium" color="palette.text.shade80" fontSize={3}>
        {field.value}
      </Text>
    </TransactionConfirmField>
  );
};

const fieldComponents = {
  "casper.method": CasperField,
  "casper.fees": CasperField,
  "casper.amount": CasperField,
};

export default {
  fieldComponents,
};
