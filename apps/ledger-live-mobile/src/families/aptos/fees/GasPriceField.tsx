import React, { useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import { View } from "react-native";
import { Result } from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import invariant from "invariant";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";

import TextInput from "../../../components/TextInput";
import LText from "../../../components/LText";
import TranslatedError from "../../../components/TranslatedError";

import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { DEFAULT_GAS_PRICE } from "@ledgerhq/live-common/families/aptos/logic";
import styles from "./styles";

type AptosTransaction = Extract<Transaction, { family: "aptos" }>;
type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
  updateTransaction: Result<AptosTransaction>["updateTransaction"];
};

const GasPriceField = forwardRef(function FeesFieldComponent(
  { account, parentAccount, transaction, status, updateTransaction }: Props,
  ref,
) {
  invariant(transaction.family === "aptos", "FeeField: aptos family expected");
  const mainAccount = getMainAccount(account, parentAccount);
  invariant(mainAccount, "Account required");
  const [localValue, setLocalValue] = useState<string | null>(null);
  const bridge = getAccountBridge(mainAccount);

  useImperativeHandle(ref, () => ({
    resetData: () => {
      setLocalValue(transaction.estimate.gasUnitPrice);
    },
  }));

  const onGasPriceChange = useCallback(
    (str: string) => {
      if (str && !BigNumber(str).isFinite()) return;
      setLocalValue(str);
      updateTransaction((transaction: AptosTransaction) =>
        bridge.updateTransaction(transaction, {
          options: {
            ...transaction.options,
            gasUnitPrice: str || transaction.estimate.gasUnitPrice,
          },
        }),
      );
    },
    [updateTransaction, bridge],
  );

  const gasUnitPrice = transaction.firstEmulation
    ? transaction.estimate.gasUnitPrice
    : localValue ?? transaction.options.gasUnitPrice ?? transaction.estimate.gasUnitPrice;
  const { gasUnitPrice: error } = status.errors;
  const { gasUnitPrice: warning } = status.warnings;

  return (
    <View style={styles.root}>
      <LText style={styles.label} color="grey" numberOfLines={1}>
        <Trans i18nKey="send.fees.aptos.gasPrice" />
      </LText>
      <TextInput
        value={gasUnitPrice}
        keyboardType="numeric"
        returnKeyType="done"
        maxLength={10}
        onChangeText={onGasPriceChange}
        placeholder={(transaction.estimate.gasUnitPrice || DEFAULT_GAS_PRICE).toString()}
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

export default GasPriceField;
