import React, { useState, memo, useMemo } from "react";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { inferDynamicRange, Range } from "@ledgerhq/live-common/range";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import invariant from "invariant";
import Button from "../../../components/Button";
import EthereumGasLimit from "../SendRowGasLimit";
import EditFeeUnitEthereum from "../EditFeeUnitEthereum";
import SectionSeparator from "../../../components/SectionSeparator";

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  onValidateFees: (transaction: Partial<Transaction>) => () => void;
};

const fallbackGasPrice = inferDynamicRange(new BigNumber(10e9));
let lastNetworkGasPrice: Range; // local cache of last value to prevent extra blinks

const EthereumLegacyCustomFees = ({
  account,
  parentAccount,
  onValidateFees,
  transaction,
}: Props) => {
  const { colors } = useTheme();

  invariant(transaction.family === "ethereum", "not ethereum family");
  invariant(account, "no account found");

  const networkGasPrice = transaction.networkInfo && transaction.networkInfo.gasPrice;
  if (!lastNetworkGasPrice && networkGasPrice) {
    lastNetworkGasPrice = networkGasPrice;
  }

  const range = networkGasPrice || lastNetworkGasPrice || fallbackGasPrice;
  const [gasPrice, setGasPrice] = useState(transaction.gasPrice || range.initial);
  const [gasLimit, setGasLimit] = useState(getGasLimit(transaction));

  const transactionPatch = useMemo<Partial<Transaction>>(
    () => ({
      userGasLimit: new BigNumber(gasLimit || 0),
      gasPrice,
      feesStrategy: "custom",
    }),
    [gasLimit, gasPrice],
  );

  return (
    <View style={styles.root}>
      <EditFeeUnitEthereum
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        feeAmount={gasPrice}
        range={range}
        onChange={value => {
          setGasPrice(value);
        }}
        title={"send.summary.gasPrice"}
      />

      <SectionSeparator style={styles.sectionSeparator} lineColor={colors.fog} />

      <View style={styles.container}>
        <EthereumGasLimit
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          gasLimit={gasLimit}
          setGasLimit={setGasLimit}
        />
      </View>

      <View style={styles.flex}>
        <Button
          event="EthereumSetCustomFees"
          type="primary"
          title={<Trans i18nKey="send.summary.validateFees" />}
          onPress={onValidateFees(transactionPatch)}
        />
      </View>
    </View>
  );
};

export default memo(EthereumLegacyCustomFees);

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
