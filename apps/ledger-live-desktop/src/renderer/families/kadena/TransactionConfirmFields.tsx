import {
  ExtraDeviceTransactionField,
  Transaction,
} from "@ledgerhq/live-common/families/kadena/types";
import React from "react";
import Text from "~/renderer/components/Text";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";

const KadenaField = ({
  field,
}: {
  transaction: Transaction;
  field: ExtraDeviceTransactionField;
}) => {
  return (
    <TransactionConfirmField label={field.label}>
      <Text
        style={{ wordBreak: "break-all", maxWidth: "70%" }}
        textAlign="right"
        ml={1}
        ff="Inter|Medium"
        color="palette.text.shade80"
        fontSize={3}
      >
        {(field as ExtraDeviceTransactionField)?.value || ""}
      </Text>
    </TransactionConfirmField>
  );
};
const fieldComponents = {
  "kadena.recipient": KadenaField,
  "kadena.gasLimit": KadenaField,
  "kadena.gasPrice": KadenaField,
};
export default {
  fieldComponents,
};
