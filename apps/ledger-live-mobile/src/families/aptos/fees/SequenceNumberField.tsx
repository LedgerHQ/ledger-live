import React, { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import { View } from "react-native";
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

const SequenceNumberField = forwardRef(function SequenceNumberFieldComponent(
  { account, parentAccount, transaction, status, updateTransaction }: Props,
  ref,
) {
  invariant(transaction.family === "aptos", "SequenceNumber: aptos family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const bridge = getAccountBridge(mainAccount);
  const [localValue, setLocalValue] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    resetData: () => {
      setLocalValue("");
    },
  }));

  const onSequenceNumberChange = useCallback(
    (str: string) => {
      if (str && !BigNumber(str).isFinite()) {
        return;
      }
      setLocalValue(str);
      updateTransaction((transaction: AptosTransaction) =>
        bridge.updateTransaction(transaction, {
          options: {
            ...transaction.options,
            sequenceNumber: str,
          },
          errors: Object.assign({}, transaction.errors, { sequenceNumber: "" }),
        }),
      );
    },
    [updateTransaction, bridge],
  );

  const sequenceNumber = transaction.firstEmulation ? "" : localValue ?? "";
  const { sequenceNumber: error } = status.errors;
  const { sequenceNumber: warning } = status.warnings;

  return (
    <View style={styles.root}>
      <LText style={styles.label} color="grey" numberOfLines={1}>
        <Trans i18nKey="send.fees.aptos.sequenceNumber" />
      </LText>
      <TextInput
        value={sequenceNumber}
        keyboardType="numeric"
        returnKeyType="done"
        maxLength={10}
        onChangeText={onSequenceNumberChange}
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

export default SequenceNumberField;
