import React, { useState, memo, useMemo, useCallback } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getDefaultFeeUnit } from "@ledgerhq/live-common/families/ethereum/logic";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import invariant from "invariant";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import EthereumGasLimit from "../SendRowGasLimit";
import EditFeeUnitEthereum from "../EditFeeUnitEthereum";
import SectionSeparator from "../../../components/SectionSeparator";
import { inferMaxFeeRange, inferMaxPriorityFeeRange } from "./utils";

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  onValidateFees: (transaction: Partial<Transaction>) => () => void;
};

const Ethereum1559CustomFees = ({
  account,
  parentAccount,
  onValidateFees,
  transaction: originalTransaction,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  invariant(originalTransaction.family === "ethereum", "not ethereum family");
  invariant(account, "no account found");

  const { currency } = getMainAccount(account, parentAccount);
  const feeUnit = getDefaultFeeUnit(currency);

  const { networkInfo } = originalTransaction;
  const [maxFeePerGas, setMaxFeePerGas] = useState(
    networkInfo?.nextBaseFeePerGas?.plus(
      networkInfo?.maxPriorityFeePerGas?.initial || 0,
    ) || new BigNumber(0),
  );
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(
    networkInfo?.maxPriorityFeePerGas?.initial || new BigNumber(0),
  );
  const [gasLimit, setGasLimit] = useState(getGasLimit(originalTransaction));

  // Creating a new transaction to simulate the bridge status response before updating
  // the original transaction
  const bridge = getAccountBridge<Transaction>(account, parentAccount);
  const { transaction, setTransaction, status } =
    useBridgeTransaction<Transaction>(() => ({
      account,
      parentAccount,
      transaction: {
        ...originalTransaction,
        maxFeePerGas,
        maxPriorityFeePerGas,
      },
    }));
  const { errors, warnings } = status;
  const { maxPriorityFee: maxPriorityFeeError, maxFee: maxFeeError } = errors;
  const { maxPriorityFee: maxPriorityFeeWarning, maxFee: maxFeeWarning } =
    warnings;

  const maxPriorityFeeRange = useMemo(
    () => inferMaxPriorityFeeRange(transaction?.networkInfo),
    [transaction?.networkInfo],
  );
  const maxFeePerGasRange = useMemo(() => {
    return inferMaxFeeRange(transaction?.networkInfo);
  }, [transaction?.networkInfo]);

  // Final patch that will be applied to the original transaction
  // in case of validation of the custom fees
  const transactionPatch = useMemo<Partial<Transaction>>(
    () => ({
      userGasLimit: new BigNumber(gasLimit),
      maxPriorityFeePerGas,
      maxFeePerGas,
      feesStrategy: "custom",
    }),
    [gasLimit, maxPriorityFeePerGas, maxFeePerGas],
  );

  const onFeesChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<BigNumber>>) =>
      (value: BigNumber) => {
        if (!transaction) return; // type guard
        setter(value); // setMaxPriorityFeePerGas or setMaxFeePerGas
        setTransaction(bridge.updateTransaction(transaction, transactionPatch));
      },
    [transaction, bridge, transactionPatch, setTransaction],
  );

  return (
    <View style={styles.root}>
      <EditFeeUnitEthereum
        account={account}
        parentAccount={parentAccount}
        transaction={transaction || originalTransaction}
        feeAmount={maxPriorityFeePerGas}
        range={maxPriorityFeeRange}
        onChange={onFeesChange(setMaxPriorityFeePerGas)}
        title={"send.summary.maxPriorityFee"}
      />
      <LText color="palette.neutral.c70">
        {`${t("send.summary.suggested")} : `}
        <LText color="palette.neutral.c90">
          {`${formatCurrencyUnit(
            feeUnit,
            networkInfo?.maxPriorityFeePerGas?.min || maxPriorityFeeRange.min,
          )} - ${formatCurrencyUnit(
            feeUnit,
            networkInfo?.maxPriorityFeePerGas?.max || maxPriorityFeeRange.max,
            {
              showCode: true,
            },
          )}`}
        </LText>
      </LText>
      {maxPriorityFeeWarning ? (
        <LText style={styles.warning} color="orange">
          {t(`errors.${maxPriorityFeeWarning.name}.title`)}
        </LText>
      ) : null}
      {maxPriorityFeeError ? (
        <LText style={styles.warning} color="red">
          {t(`errors.${maxPriorityFeeError.name}.title`)}
        </LText>
      ) : null}

      <SectionSeparator
        style={styles.sectionSeparator}
        lineColor={"transparent"}
      />

      <EditFeeUnitEthereum
        account={account}
        parentAccount={parentAccount}
        transaction={transaction || originalTransaction}
        feeAmount={maxFeePerGas}
        range={maxFeePerGasRange}
        onChange={onFeesChange(setMaxFeePerGas)}
        title={"send.summary.maxFee"}
      />
      <LText color="palette.neutral.c70">
        {`${t("send.summary.nextBlock")} : `}
        <LText color="palette.neutral.c90">
          {formatCurrencyUnit(
            feeUnit,
            networkInfo?.nextBaseFeePerGas || new BigNumber(0),
            {
              showCode: true,
            },
          )}
        </LText>
      </LText>
      {maxFeeWarning ? (
        <LText style={styles.warning} color="orange">
          {t(`errors.${maxFeeWarning.name}.title`)}
        </LText>
      ) : null}
      {maxFeeError ? (
        <LText style={styles.warning} color="red">
          {t(`errors.${maxFeeError.name}.title`)}
        </LText>
      ) : null}

      <SectionSeparator
        style={styles.sectionSeparator}
        lineColor={colors.fog}
      />

      <View style={styles.container}>
        <EthereumGasLimit
          account={account}
          parentAccount={parentAccount}
          transaction={transaction as Transaction}
          gasLimit={gasLimit}
          setGasLimit={setGasLimit}
        />
      </View>

      <View style={styles.flex}>
        <Button
          event="EthereumSetCustomFees"
          type="primary"
          title={t("send.summary.validateFees")}
          disabled={Boolean(maxPriorityFeeError || maxFeeError)}
          onPress={onValidateFees(transactionPatch)}
        />
      </View>
    </View>
  );
};

export default memo(Ethereum1559CustomFees);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
    flexDirection: "column",
  },
  container: {
    flex: 1,
  },
  sectionSeparator: {
    marginTop: 16,
  },
  infoLabel: {
    marginVertical: 16,
  },
  warning: {
    fontSize: 14,
    marginTop: 16,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
