// @flow

import invariant from "invariant";
import React from "react";
import type { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";
import { StyleSheet } from "react-native";
import { ExtraDeviceTransactionField } from "@ledgerhq/live-common/families/casper/deviceTransactionConfig";
import { DataRow } from "../../components/ValidateOnDeviceDataRow";
import LText from "../../components/LText";

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});

const CasperField = ({
  transaction,
  field,
}: {
  transaction: Transaction;
  field: DeviceTransactionField;
}) => {
  invariant(transaction.family === "casper", "casper transaction");

  return (
    <DataRow label={field.label}>
      <LText semiBold style={styles.text}>
        {(field as ExtraDeviceTransactionField).value}
      </LText>
    </DataRow>
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
