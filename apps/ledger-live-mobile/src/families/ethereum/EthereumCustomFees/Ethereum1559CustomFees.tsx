import React, { useState, memo, useMemo, useCallback, useEffect } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getDefaultFeeUnit } from "@ledgerhq/live-common/families/ethereum/logic";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import { Transaction, TransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import invariant from "invariant";
import { getEnv } from "@ledgerhq/live-env";
import { MaxFeeTooLow } from "@ledgerhq/errors";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import EthereumGasLimit from "../SendRowGasLimit";
import EditFeeUnitEthereum from "../EditFeeUnitEthereum";
import SectionSeparator from "../../../components/SectionSeparator";
import { inferMaxFeeRange, inferMaxPriorityFeeRange } from "./utils";
import { CurrentNetworkFee } from "../CurrentNetworkFee";

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  transactionRaw?: TransactionRaw;
  onValidateFees: (transaction: Partial<Transaction>) => () => void;
};

const Ethereum1559CustomFees = ({
  account,
  parentAccount,
  transaction: originalTransaction,
  transactionRaw,
  onValidateFees,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  invariant(originalTransaction.family === "ethereum", "not ethereum family");
  invariant(account, "no account found");

  const { currency } = getMainAccount(account, parentAccount);
  const feeUnit = getDefaultFeeUnit(currency);

  const { networkInfo } = originalTransaction;
  const [maxFeePerGas, setMaxFeePerGas] = useState(
    networkInfo?.nextBaseFeePerGas?.plus(networkInfo?.maxPriorityFeePerGas?.initial || 0) ||
      new BigNumber(0),
  );
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(
    networkInfo?.maxPriorityFeePerGas?.initial || new BigNumber(0),
  );
  const [gasLimit, setGasLimit] = useState(getGasLimit(originalTransaction));

  // Creating a new transaction to simulate the bridge status response before updating
  // the original transaction
  const bridge = getAccountBridge<Transaction>(account, parentAccount);
  const { transaction, setTransaction, status } = useBridgeTransaction<Transaction>(() => ({
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
  const { maxPriorityFee: maxPriorityFeeWarning } = warnings;
  let { maxFee: maxFeeWarning } = warnings;

  // give user a warning if maxFeePerGas is lower than 1.1 * pending transaction maxFeePerGas for edit eth transaction feature
  if (!maxFeeWarning && transactionRaw?.maxPriorityFeePerGas && transactionRaw?.maxFeePerGas) {
    const maxFeeGap: number = getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR");

    const lowerLimitMaxFeePerGas = new BigNumber(transactionRaw.maxFeePerGas).times(1 + maxFeeGap);

    if (transaction?.maxFeePerGas?.isLessThan(lowerLimitMaxFeePerGas)) {
      maxFeeWarning = new MaxFeeTooLow();
    }
  }

  const maxPriorityFeeRange = useMemo(
    () => inferMaxPriorityFeeRange(transaction?.networkInfo, transactionRaw),
    [transaction?.networkInfo, transactionRaw],
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

  const [maxPriorityFeePerGasError, setMaxPriorityFeePerGasError] = useState("");

  useEffect(() => {
    if (
      transactionRaw?.maxPriorityFeePerGas &&
      maxPriorityFeePerGas.isLessThan(new BigNumber(transactionRaw.maxPriorityFeePerGas))
    ) {
      setMaxPriorityFeePerGasError(t("errors.MaxPriorityFeeLowerThanInitial.title"));
    } else {
      setMaxPriorityFeePerGasError("");
    }
  }, [maxPriorityFeePerGas, transactionRaw, t]);

  const onFeesChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<BigNumber>>) => (value: BigNumber) => {
      if (!transaction) return; // type guard
      setter(value); // setMaxPriorityFeePerGas or setMaxFeePerGas
    },
    [transaction],
  );

  useEffect(() => {
    if (!transaction) return;
    setTransaction(bridge.updateTransaction(transaction, transactionPatch));

    // https://github.com/LedgerHQ/ledger-live/pull/4147#discussion_r1277351782
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPriorityFeePerGas, maxFeePerGas, transactionPatch]);

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

      <SectionSeparator style={styles.sectionSeparator} lineColor={"transparent"} />
      {maxPriorityFeePerGasError ? (
        <LText style={styles.warning} color="orange">
          {maxPriorityFeePerGasError}
        </LText>
      ) : null}
      <SectionSeparator style={styles.sectionSeparator} lineColor={"transparent"} />

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
          {formatCurrencyUnit(feeUnit, networkInfo?.nextBaseFeePerGas || new BigNumber(0), {
            showCode: true,
          })}
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

      <SectionSeparator style={styles.sectionSeparator} lineColor={colors.fog} />

      <View style={styles.container}>
        <EthereumGasLimit
          account={account}
          parentAccount={parentAccount}
          transaction={transaction as Transaction}
          gasLimit={gasLimit}
          setGasLimit={setGasLimit}
        />
      </View>

      <View>
        <CurrentNetworkFee
          advancedMode
          account={account}
          parentAccount={parentAccount}
          transactionRaw={transactionRaw}
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
