import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import { Trans } from "react-i18next";
import { DataRow } from "~/components/ValidateOnDeviceDataRow";
import LText from "~/components/LText";

type Props = {
  transaction: Transaction;
};

const StellarMemoField = (props: Props) => {
  const { transaction } = props as { transaction: StellarTransaction };
  const label = useMemo(() => {
    if (
      transaction.memoType &&
      deviceMemoLabels[transaction.memoType as keyof typeof deviceMemoLabels]
    ) {
      return deviceMemoLabels[transaction.memoType as keyof typeof deviceMemoLabels];
    }
    return deviceMemoLabels.NO_MEMO;
  }, [transaction.memoType]);
  return (
    <DataRow label={label}>
      <LText semiBold style={styles.text}>
        {transaction.memoValue ? `${transaction.memoValue} ` : "[none]"}
      </LText>
    </DataRow>
  );
};

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
      {(transaction as StellarTransaction).assetCode}
    </LText>
  </DataRow>
);

const StellarAssetIssuerField = ({ transaction }: Props) => (
  <DataRow label={<Trans i18nKey="stellar.assetIssuer" />}>
    <LText semiBold style={styles.text}>
      {(transaction as StellarTransaction).assetIssuer}
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
