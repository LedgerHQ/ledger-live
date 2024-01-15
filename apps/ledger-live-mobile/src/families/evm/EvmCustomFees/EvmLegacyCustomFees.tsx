import { getGasLimit } from "@ledgerhq/coin-evm/logic";
import { Transaction } from "@ledgerhq/coin-evm/types/index";
import { Account } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { memo, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Button from "~/components/Button";
import SectionSeparator from "~/components/SectionSeparator";
import EditFeeUnitEvm from "../EditFeeUnitEvm";
import EvmGasLimit from "../SendRowGasLimit";
import { inferGasPriceRange } from "./utils";

type Props = {
  account: Account;
  transaction: Transaction;
  onValidateFees: (transaction: Partial<Transaction>) => () => void;
};

const EvmLegacyCustomFees = ({ account, onValidateFees, transaction }: Props) => {
  const { colors } = useTheme();

  invariant(transaction.family === "evm", "not evm family");
  invariant(account, "no account found");

  const { gasOptions } = transaction;

  // TODO: Make GasOptions optional in the future.
  // Use fallback mechanisms to infer min & max values based on the FeeData returned by a node
  // This will make this "advanced" mode compatible with EVM chains without gasTracker
  invariant(gasOptions, "GasPriceField: 'transaction.gasOptions' should be defined");

  const range = useMemo(() => {
    return inferGasPriceRange(gasOptions);
  }, [gasOptions]);

  const [gasPrice, setGasPrice] = useState(transaction.gasPrice || range.initial);
  const [gasLimit, setGasLimit] = useState(getGasLimit(transaction));

  const transactionPatch = useMemo<Partial<Transaction>>(
    () => ({
      customGasLimit: new BigNumber(gasLimit || 0),
      gasPrice,
      feesStrategy: "custom",
    }),
    [gasLimit, gasPrice],
  );

  return (
    <View style={styles.root}>
      <EditFeeUnitEvm
        account={account}
        feeAmount={gasPrice}
        range={range}
        onChange={value => {
          setGasPrice(value);
        }}
        title={"send.summary.gasPrice"}
      />

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
          title={<Trans i18nKey="send.summary.validateFees" />}
          onPress={onValidateFees(transactionPatch)}
        />
      </View>
    </View>
  );
};

export default memo(EvmLegacyCustomFees);

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
  accountContainer: {
    flex: 1,
    flexDirection: "row",
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
