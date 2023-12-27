import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getGasLimit } from "@ledgerhq/coin-evm/logic";
import type { EvmTransactionEIP1559 } from "@ledgerhq/coin-evm/types/index";
import { Account } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Button from "~/components/Button";
import LText from "~/components/LText";
import SectionSeparator from "~/components/SectionSeparator";
import EditFeeUnitEvm from "../EditFeeUnitEvm";
import EvmGasLimit from "../SendRowGasLimit";
import { inferMaxFeeRange, inferMaxPriorityFeeRange } from "./utils";

type Props = {
  account: Account;
  transaction: EvmTransactionEIP1559;
  onValidateFees: (transaction: Partial<EvmTransactionEIP1559>) => () => void;
};

const Evm1559CustomFees = ({
  account,
  onValidateFees,
  transaction: originalTransaction,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  invariant(originalTransaction.family === "evm", "not evm family");
  invariant(account, "no account found");

  const { gasOptions } = originalTransaction;

  // TODO: Make GasOptions optional in the future.
  // Use fallback mechanisms to infer min & max values based on the FeeData returned by a node
  // This will make this "advanced" mode compatible with EVM chains without gasTracker
  invariant(gasOptions, "PriorityFeeField: 'transaction.gasOptions' should be defined");

  const [maxFeePerGas, setMaxFeePerGas] = useState<BigNumber>(
    originalTransaction.maxFeePerGas || new BigNumber(0),
  );
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<BigNumber>(
    originalTransaction.maxPriorityFeePerGas ?? gasOptions.medium.maxPriorityFeePerGas!,
  );
  const [gasLimit, setGasLimit] = useState(getGasLimit(originalTransaction));

  // Creating a new transaction to simulate the bridge status response before updating
  // the original transaction
  const bridge = getAccountBridge<EvmTransactionEIP1559>(account);

  const { transaction, setTransaction, status } = useBridgeTransaction<EvmTransactionEIP1559>(
    () => ({
      account,
      transaction: { ...originalTransaction, maxFeePerGas, maxPriorityFeePerGas },
    }),
  );

  invariant(transaction, "no transaction found");

  const { errors, warnings } = status;
  const { maxPriorityFee: maxPriorityFeeError, maxFee: maxFeeError } = errors;
  const { maxPriorityFee: maxPriorityFeeWarning, maxFee: maxFeeWarning } = warnings;

  const maxPriorityFeeRange = useMemo(() => inferMaxPriorityFeeRange(gasOptions), [gasOptions]);
  const maxFeePerGasRange = useMemo(() => {
    return inferMaxFeeRange(gasOptions);
  }, [gasOptions]);

  const { units } = account.currency;
  const unit = units.length > 1 ? units[1] : units[0];
  const unitName = unit.code;

  const [lowPriorityFeeValue, highPriorityFeeValue] = useMemo(
    () => [
      formatCurrencyUnit(unit, gasOptions.slow.maxPriorityFeePerGas!),
      formatCurrencyUnit(unit, gasOptions.fast.maxPriorityFeePerGas!),
    ],
    [gasOptions.slow, gasOptions.fast, unit],
  );

  const nextBaseFeeValue = useMemo(
    () =>
      formatCurrencyUnit(unit, transaction.gasOptions?.medium.nextBaseFee || new BigNumber(0), {
        showCode: true,
        disableRounding: true,
      }),
    [transaction.gasOptions?.medium.nextBaseFee, unit],
  );

  // Final patch that will be applied to the original transaction
  // in case of validation of the custom fees
  const transactionPatch = useMemo<Partial<EvmTransactionEIP1559>>(
    () => ({
      customGasLimit: new BigNumber(gasLimit),
      maxPriorityFeePerGas,
      maxFeePerGas,
      feesStrategy: "custom",
    }),
    [gasLimit, maxPriorityFeePerGas, maxFeePerGas],
  );

  const onFeesChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<BigNumber>>) => (value: BigNumber) => {
      if (!transaction) return; // type guard
      setter(value); // setMaxPriorityFeePerGas or setMaxFeePerGas
      setTransaction(bridge.updateTransaction(transaction, transactionPatch));
    },
    [transaction, bridge, transactionPatch, setTransaction],
  );

  return (
    <View style={styles.root}>
      <EditFeeUnitEvm
        account={account}
        feeAmount={maxPriorityFeePerGas}
        range={maxPriorityFeeRange}
        onChange={onFeesChange(setMaxPriorityFeePerGas)}
        title={"send.summary.maxPriorityFee"}
      />
      <LText color="palette.neutral.c70">
        {`${t("send.summary.suggested")} : `}
        <LText color="palette.neutral.c90">
          {lowPriorityFeeValue} - {highPriorityFeeValue} {unitName}
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

      <EditFeeUnitEvm
        account={account}
        feeAmount={maxFeePerGas}
        range={maxFeePerGasRange}
        onChange={onFeesChange(setMaxFeePerGas)}
        title={"send.summary.maxFee"}
      />
      <LText color="palette.neutral.c70">
        {`${t("send.summary.nextBlock")} : `}
        <LText color="palette.neutral.c90">{nextBaseFeeValue}</LText>
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
        <EvmGasLimit
          account={account}
          transaction={transaction}
          gasLimit={gasLimit}
          setGasLimit={setGasLimit}
        />
      </View>

      <View style={styles.flex}>
        <Button
          event="EvmSetCustomFees"
          type="primary"
          title={t("send.summary.validateFees")}
          disabled={Boolean(maxPriorityFeeError || maxFeeError)}
          onPress={onValidateFees(transactionPatch)}
        />
      </View>
    </View>
  );
};

export default memo(Evm1559CustomFees);

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
