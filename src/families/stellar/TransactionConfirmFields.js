// @flow
import React from "react";
import { StyleSheet } from "react-native";
import type { Account, Transaction } from "@ledgerhq/live-common/lib/types";
import { shortAddressPreview } from "@ledgerhq/live-common/lib/account";
import { translate } from "react-i18next";

import { DataRow } from "../../components/ValidateOnDeviceDataRow";
import LText from "../../components/LText";
import colors from "../../colors";
import type { T } from "../../types/common";

const styles = StyleSheet.create({
  text: {
    color: colors.darkBlue,
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
});

const Post = ({
  account,
  transaction,
  t,
}: {
  account: Account,
  transaction: Transaction,
  t: T,
}) => {
  return (
    <>
      <DataRow
        label={t(
          `stellar.memoType.${
            transaction.memoType ? transaction.memoType : "NO_MEMO"
          }`,
        )}
      >
        <LText semiBold style={styles.text}>
          {transaction.memoValue ? `${transaction.memoValue} ` : "[none]"}
        </LText>
      </DataRow>
      <DataRow label={t("stellar.network")}>
        <LText semiBold style={styles.text}>
          {t("stellar.networkPublic")}
        </LText>
      </DataRow>
      <DataRow label={t("stellar.sourceAddress")}>
        <LText semiBold style={styles.text}>
          {shortAddressPreview(account.freshAddress, 16)}
        </LText>
      </DataRow>
    </>
  );
};

export default {
  post: translate()(Post),
};
