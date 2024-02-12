import React from "react";
import TransactionConfirmField from "~/renderer/components/TransactionConfirm/TransactionConfirmField";
import Text from "~/renderer/components/Text";
import { Transaction } from "@ledgerhq/live-common/families/filecoin/types";
import { DeviceTransactionField } from "@ledgerhq/live-common/transaction/index";
import { ExtraDeviceTransactionField } from "@ledgerhq/live-common/families/filecoin/deviceTransactionConfig";

const FilecoinField = ({ field }: { transaction: Transaction; field: DeviceTransactionField }) => {
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
  "filecoin.gasFeeCap": FilecoinField,
  "filecoin.gasPremium": FilecoinField,
  "filecoin.gasLimit": FilecoinField,
  "filecoin.method": FilecoinField,
};
export default {
  fieldComponents,
};
