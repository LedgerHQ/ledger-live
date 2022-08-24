import React, { useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { inferDynamicRange } from "@ledgerhq/live-common/range";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getGasLimit,
  EIP1559ShouldBeUsed,
} from "@ledgerhq/live-common/families/ethereum/transaction";

import { accountScreenSelector } from "../../reducers/accounts";
import EditFeeUnitEthereum from "./EditFeeUnitEthereum";
import SectionSeparator from "../../components/SectionSeparator";
import Button from "../../components/Button";
import EthereumGasLimit from "./SendRowGasLimit";
import type { RouteParams } from "../../screens/SendFunds/04-Summary";

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
const options = {
  title: <Trans i18nKey="send.summary.fees" />,
  headerLeft: null,
};
const fallbackGasPrice = inferDynamicRange(BigNumber(10e9));
const fallbackMaxBaseFee = BigNumber(10e9);
// local cache of last values to prevent extra blinks
let lastNetworkGasPrice;
let lastNetworkMaxBaseFee;
let lastNetworkPriorityFee;

export default function EthereumCustomFees({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { transaction } = route.params;
  invariant(transaction.family === "ethereum", "not ethereum family");
  invariant(account, "no account found");
  const networkGasPrice =
    transaction.networkInfo && transaction.networkInfo.gasPrice;

  if (!lastNetworkGasPrice && networkGasPrice) {
    lastNetworkGasPrice = networkGasPrice;
  }
  const gasPriceRange =
    networkGasPrice || lastNetworkGasPrice || fallbackGasPrice;
  const [gasPrice, setGasPrice] = useState(
    transaction.gasPrice || gasPriceRange.initial,
  );

  const networkMaxBaseFee =
    transaction.networkInfo && transaction.networkInfo.nextBaseFeePerGas;
  if (!lastNetworkMaxBaseFee && networkMaxBaseFee) {
    lastNetworkMaxBaseFee = networkMaxBaseFee;
  }
  const maxBaseFeeRange = inferDynamicRange(
    networkMaxBaseFee || lastNetworkMaxBaseFee || fallbackMaxBaseFee,
  );

  const [maxBaseFee, setMaxBaseFee] = useState(
    transaction.maxBaseFeePerGas ||
      networkMaxBaseFee ||
      lastNetworkMaxBaseFee ||
      fallbackMaxBaseFee,
  );

  const networkPriorityFee =
    transaction.networkInfo && transaction.networkInfo.maxPriorityFeePerGas;
  if (!lastNetworkPriorityFee && networkPriorityFee) {
    lastNetworkPriorityFee = networkPriorityFee;
  }
  const maxPriorityFeeRange =
    networkPriorityFee || lastNetworkPriorityFee || fallbackGasPrice;
  const [priorityFee, setPriorityFee] = useState(
    transaction.maxPriorityFeePerGas || maxPriorityFeeRange.initial,
  );
  const [gasLimit, setGasLimit] = useState(getGasLimit(transaction));
  const onValidate = useCallback(() => {
    const bridge = getAccountBridge(account, parentAccount);
    const { currentNavigation } = route.params;
    navigation.navigate(currentNavigation, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction: bridge.updateTransaction(transaction, {
        userGasLimit: BigNumber(gasLimit || 0),
        gasPrice,
        maxBaseFeePerGas: maxBaseFee,
        maxPriorityFeePerGas: priorityFee,
        feesStrategy: "custom",
      }),
    });
  }, [
    account,
    gasLimit,
    navigation,
    parentAccount,
    route.params,
    transaction,
    gasPrice,
  ]);
  return (
    <View style={styles.root}>
      {EIP1559ShouldBeUsed(account.currency) ? (
        <>
          <EditFeeUnitEthereum
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            feeAmount={maxBaseFee}
            range={maxBaseFeeRange}
            onChange={value => {
              setMaxBaseFee(value);
            }}
            title="send.summary.maxBaseFee"
          />
          <SectionSeparator
            style={styles.sectionSeparator}
            lineColor={colors.background}
          />
          <EditFeeUnitEthereum
            account={account}
            parentAccount={parentAccount}
            transaction={transaction}
            feeAmount={priorityFee}
            range={maxPriorityFeeRange}
            onChange={value => {
              setPriorityFee(value);
            }}
            title="send.summary.priorityFee"
          />
        </>
      ) : (
        <EditFeeUnitEthereum
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          feeAmount={gasPrice}
          range={gasPriceRange}
          onChange={value => {
            setGasPrice(value);
          }}
          title="send.summary.gasPrice"
        />
      )}

      <SectionSeparator
        style={styles.sectionSeparator}
        lineColor={colors.fog}
      />

      <View style={styles.container}>
        <EthereumGasLimit
          account={account}
          parentAccount={parentAccount}
          transaction={transaction}
          route={route}
          gasLimit={gasLimit}
          setGasLimit={setGasLimit}
        />
      </View>

      <View style={styles.flex}>
        <Button
          event="EthereumSetCustomFees"
          type="primary"
          title={<Trans i18nKey="send.summary.validateFees" />}
          onPress={onValidate}
        />
      </View>
    </View>
  );
}
export { options, EthereumCustomFees as component };
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
  valueText: {
    fontSize: 16,
  },
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
