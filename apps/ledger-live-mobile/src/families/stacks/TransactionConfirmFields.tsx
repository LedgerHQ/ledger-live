import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { ExtraDeviceTransactionField } from "@ledgerhq/live-common/families/stacks/deviceTransactionConfig";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import LText from "~/components/LText";
import { DataRow } from "~/components/ValidateOnDeviceDataRow";

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});

const StacksField = ({
  transaction,
  field,
}: {
  transaction: Transaction;
  field: DeviceTransactionField;
}) => {
  invariant(transaction.family === "stacks", "stacks transaction");
  return (
    <DataRow label={field.label}>
      <LText semiBold style={styles.text}>
        {(field as ExtraDeviceTransactionField).value as React.ReactNode}
      </LText>
    </DataRow>
  );
};

const fieldComponents = {
  "stacks.memo": StacksField,
};
export default {
  fieldComponents,
};
