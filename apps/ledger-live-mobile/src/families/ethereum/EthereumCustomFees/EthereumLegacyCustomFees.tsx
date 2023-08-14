import React, { useState, memo, useMemo } from "react";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import { Transaction, TransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";
import { inferDynamicRange, Range } from "@ledgerhq/live-common/range";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import { getEnv } from "@ledgerhq/live-env";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import { Trans } from "react-i18next";
import invariant from "invariant";

import Button from "../../../components/Button";
import EthereumGasLimit from "../SendRowGasLimit";
import EditFeeUnitEthereum from "../EditFeeUnitEthereum";
import SectionSeparator from "../../../components/SectionSeparator";
import { CurrentNetworkFee } from "../CurrentNetworkFee";

type Props = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  transactionRaw?: TransactionRaw;
  onValidateFees: (transaction: Partial<Transaction>) => () => void;
};

const fallbackGasPrice = inferDynamicRange(new BigNumber(10e9));
let lastNetworkGasPrice: Range; // local cache of last value to prevent extra blinks

const EthereumLegacyCustomFees = ({
  account,
  parentAccount,
  transaction,
  transactionRaw,
  onValidateFees,
}: Props) => {
  const { colors } = useTheme();

  invariant(transaction.family === "ethereum", "not ethereum family");
  invariant(account, "no account found");

  const networkGasPrice = transaction.networkInfo && transaction.networkInfo.gasPrice;
  if (!lastNetworkGasPrice && networkGasPrice) {
    lastNetworkGasPrice = networkGasPrice;
  }

  let range = lastNetworkGasPrice || fallbackGasPrice;
  const [gasPrice, setGasPrice] = useState(transaction.gasPrice || range.initial);
  const [gasLimit, setGasLimit] = useState(getGasLimit(transaction));

  // update gas price range according to previous pending transaction if necessary
  if (transactionRaw?.gasPrice) {
    const gaspriceGap: number = getEnv("EDIT_TX_NON_EIP1559_GASPRICE_GAP_SPEEDUP_FACTOR");
    const minNewGasPrice = new BigNumber(transactionRaw.gasPrice).times(1 + gaspriceGap);
    const minValue = BigNumber.max(range.min, minNewGasPrice);
    let maxValue = BigNumber.max(range.max, minNewGasPrice);
    // avoid lower bound = upper bound, which will cause an error in inferDynamicRange
    if (minValue.isEqualTo(maxValue)) {
      maxValue = minValue.times(2);
    }

    range = inferDynamicRange(minValue, {
      minValue,
      maxValue,
    });
  }

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

      <View>
        <CurrentNetworkFee
          advancedMode
          account={account}
          parentAccount={parentAccount}
          transactionRaw={transactionRaw}
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
