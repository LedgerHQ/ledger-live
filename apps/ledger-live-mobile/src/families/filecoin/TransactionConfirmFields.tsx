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

const FilecoinField = ({
  transaction,
  field,
}: {
  transaction: any;
  field: DeviceTransactionField;
}) => {
  invariant(transaction.family === "filecoin", "filecoin transaction");
  return (
    <DataRow label={field.label}>
      <LText semiBold style={styles.text}>
        {field.value}
      </LText>
    </DataRow>
  );
};

const fieldComponents = {
  "filecoin.gasFeeCap": FilecoinField,
  "filecoin.gasPremium": FilecoinField,
  "filecoin.gasLimit": FilecoinField,
  "filecoin.method": FilecoinField,
};
export default {
  fieldComponents,
};
