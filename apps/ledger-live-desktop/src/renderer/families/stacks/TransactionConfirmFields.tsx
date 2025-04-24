import invariant from "invariant";
import React from "react";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import Text from "~/renderer/components/Text";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";

const addressStyle: React.CSSProperties = {
  wordBreak: "break-all",
  textAlign: "right",
  maxWidth: "70%",
};

const StacksMemoField = ({ field }: { field: DeviceTransactionField }) => {
  invariant(field.type === "stacks.memo", "stacks.memo field expected");
  return (
    <TransactionConfirmField label={field.label}>
      <Text style={addressStyle} ml={1} ff="Inter|Medium" color="palette.text.shade80" fontSize={3}>
        {field.value}
      </Text>
    </TransactionConfirmField>
  );
};

const fieldComponents = {
  "stacks.memo": StacksMemoField,
};

export default {
  fieldComponents,
};
