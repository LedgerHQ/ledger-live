import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { Trans } from "react-i18next";
import { View } from "react-native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";

import TextInput from "../../../components/TextInput";
import LText from "../../../components/LText";
import TranslatedError from "../../../components/TranslatedError";

import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import styles from "./styles";

type AptosTransaction = Extract<Transaction, { family: "aptos" }>;
type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: AptosTransaction;
  status: TransactionStatus;
  updateTransaction: Result<AptosTransaction>["updateTransaction"];
};

const ExpirationTimestampField = forwardRef(function ExpirationTimestampComponent(
  { account, parentAccount, transaction, status, updateTransaction }: Props,
  ref,
) {
  invariant(transaction.family === "aptos", "ExpirationTimestamp: aptos family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const bridge = getAccountBridge(mainAccount);
  const [localValue, setLocalValue] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    resetData: () => {
      setLocalValue(null);
    },
  }));

  const onExpirationTimestampChange = useCallback(
    (str: string) => {
      if (str && !BigNumber(str).isFinite()) return;
      setLocalValue(str);
      updateTransaction((transaction: AptosTransaction) =>
        bridge.updateTransaction(transaction, {
          options: {
            ...transaction.options,
            expirationTimestampSecs: str,
          },
          errors: Object.assign({}, transaction.errors, { expirationTimestampSecs: "" }),
        }),
      );
    },
    [updateTransaction, bridge],
  );

  const expirationTimestampSecs = transaction.firstEmulation ? "" : localValue ?? "";
  const { expirationTimestampSecs: error } = status.errors;
  const { expirationTimestampSecs: warning } = status.warnings;

  return (
    <View style={styles.root}>
      <LText style={styles.label} color="grey" numberOfLines={1}>
        <Trans i18nKey="send.fees.aptos.expTimestamp" />
      </LText>
      <TextInput
        value={expirationTimestampSecs}
        keyboardType="numeric"
        returnKeyType="done"
        maxLength={10}
        onChangeText={onExpirationTimestampChange}
        placeholder="Auto"
      />
      {(error || warning) && (
        <LText
          style={[styles.warningBox]}
          color={error ? "alert" : warning ? "orange" : "darkBlue"}
        >
          <TranslatedError error={error || warning} />
        </LText>
      )}
    </View>
  );
});

export default ExpirationTimestampField;
