import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import LText from "../../components/LText";
import { DataRow } from "../../components/ValidateOnDeviceDataRow";

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
  transaction: any;
  field: DeviceTransactionField;
}) => {
  invariant(transaction.family === "stacks", "stacks transaction");
  return (
    <DataRow label={field.label}>
      <LText semiBold style={styles.text}>
        {field.value}
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
