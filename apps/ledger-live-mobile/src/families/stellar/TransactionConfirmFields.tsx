import React from "react";
import { StyleSheet } from "react-native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { Trans } from "react-i18next";
import { DataRow } from "../../components/ValidateOnDeviceDataRow";
import LText from "../../components/LText";

type Props = {
  transaction: Transaction;
};

const StellarMemoField = ({ transaction }: Props) => (
  <DataRow label={deviceMemoLabels[transaction.memoType || "NO_MEMO"]}>
    <LText semiBold style={styles.text}>
      {transaction.memoValue ? `${transaction.memoValue} ` : "[none]"}
    </LText>
  </DataRow>
);

const StellarNetworkField = () => (
  <DataRow label="Network">
    <LText semiBold style={styles.text}>
      {"Public"}
    </LText>
  </DataRow>
);

const StellarAssetCodeField = ({ transaction }: Props) => (
  <DataRow label={<Trans i18nKey="stellar.assetCode" />}>
    <LText semiBold style={styles.text}>
      {transaction.assetCode}
    </LText>
  </DataRow>
);

const StellarAssetIssuerField = ({ transaction }: Props) => (
  <DataRow label={<Trans i18nKey="stellar.assetIssuer" />}>
    <LText semiBold style={styles.text}>
      {transaction.assetIssuer}
    </LText>
  </DataRow>
);

const fieldComponents = {
  "stellar.memo": StellarMemoField,
  "stellar.network": StellarNetworkField,
  "stellar.assetCode": StellarAssetCodeField,
  "stellar.assetIssuer": StellarAssetIssuerField,
};
export default {
  fieldComponents,
};
const deviceMemoLabels = {
  MEMO_TEXT: "Memo Text",
  NO_MEMO: "Memo",
  MEMO_ID: "Memo ID",
  MEMO_HASH: "Memo Hash",
  MEMO_RETURN: "Memo Return",
};
const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});
