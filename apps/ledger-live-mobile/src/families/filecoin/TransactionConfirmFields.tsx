import invariant from "invariant";
import React from "react";
import { StyleSheet } from "react-native";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ExtraDeviceTransactionField } from "@ledgerhq/live-common/families/filecoin/deviceTransactionConfig";
import LText from "~/components/LText";
import { DataRow } from "~/components/ValidateOnDeviceDataRow";

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
  transaction: Transaction;
  field: DeviceTransactionField;
}) => {
  invariant(transaction.family === "filecoin", "filecoin transaction");
  return (
    <DataRow label={field.label}>
      <LText semiBold style={styles.text}>
        {(field as ExtraDeviceTransactionField).value}
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
