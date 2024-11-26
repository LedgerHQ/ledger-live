import React, { forwardRef, useCallback, useState, useImperativeHandle } from "react";
import { Trans } from "react-i18next";
import { View } from "react-native";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";

import TextInput from "../../../components/TextInput";
import LText from "../../../components/LText";
import TranslatedError from "../../../components/TranslatedError";

import { DEFAULT_GAS } from "@ledgerhq/live-common/families/aptos/logic";
import styles from "./styles";

type AptosTransaction = Extract<Transaction, { family: "aptos" }>;
type Props = {
  transaction: AptosTransaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  status: TransactionStatus;
  updateTransaction: Result<AptosTransaction>["updateTransaction"];
  setTransaction: (t: AptosTransaction) => void;
};

const MaxGasAmountField = forwardRef(function MaxGasAmountFieldComponent(
  { account, parentAccount, transaction, status, updateTransaction }: Props,
  ref,
) {
  invariant(transaction.family === "aptos", "MaxGasAmount: aptos family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const bridge = getAccountBridge(mainAccount);
  const [localValue, setLocalValue] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    resetData: () => {
      setLocalValue(transaction.estimate.maxGasAmount);
    },
  }));

  const onMaxGasAmountChange = useCallback(
    (str: string) => {
      if (str && !BigNumber(str).isFinite()) return;
      setLocalValue(str);
      updateTransaction((transaction: AptosTransaction) =>
        bridge.updateTransaction(transaction, {
          options: {
            ...transaction.options,
            maxGasAmount: str || transaction.estimate.maxGasAmount,
          },
        }),
      );
    },
    [bridge, updateTransaction],
  );

  const maxGasAmount = transaction.firstEmulation
    ? transaction.estimate.maxGasAmount
    : localValue ?? transaction.options.maxGasAmount ?? transaction.estimate.maxGasAmount;
  const { maxGasAmount: errorGas, amount: errorAmount } = status.errors;
  const { maxGasAmount: warningGas, amount: warningAmount } = status.warnings;
  const error = errorGas || errorAmount;
  const warning = warningGas || warningAmount;

  return (
    <View style={styles.root}>
      <LText style={styles.label} color="grey" numberOfLines={1}>
        <Trans i18nKey="send.fees.aptos.gasLimit" />
      </LText>
      <TextInput
        value={maxGasAmount}
        keyboardType="numeric"
        returnKeyType="done"
        maxLength={10}
        onChangeText={onMaxGasAmountChange}
        placeholder={(transaction.estimate.maxGasAmount || DEFAULT_GAS).toString()}
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

export default MaxGasAmountField;
