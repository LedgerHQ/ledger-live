import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { Icons, Text } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { getEstimatedFees } from "@ledgerhq/live-common/families/hedera/utils";
import { ScreenName } from "../../../../const";

import Button from "../../../../components/Button";

import { StackNavigatorProps } from "../../../../components/RootNavigator/types/helpers";
import { HederaStakeFlowParamList } from "../types";
import { accountScreenSelector } from "../../../../reducers/accounts";

// type RouteParams = {
//   account: HederaAccount;
//   transaction: Transaction;
// };

type Props = StackNavigatorProps<
  HederaStakeFlowParamList,
  ScreenName.HederaStakeSummary
>;

function StepSummary({ navigation, route }: Props) {
  const transaction = route.params.transaction;
  const nodeList = route.params.nodeList;
  const { colors } = useTheme();

  let nodeDescription: string | undefined = "";
  if (transaction?.staked?.nodeId != null) {
    nodeDescription = nodeList?.find(
      option => option.label === transaction?.staked?.nodeId?.toString(),
    )?.description;
    nodeDescription = nodeDescription?.replace("Hosted by ", "");
  }

  const onNext = () => {
    navigation.navigate(ScreenName.HederaStakeSelectDevice, {
      ...route.params,
      transaction,
    });
  };

  const [fee, setFee] = useState(0);

  useEffect(() => {
    async function getEstimatedFee() {
      const estimatedTransferFee = await getEstimatedFees();
      const feeIntermediate = estimatedTransferFee
        .dividedBy(100_000_000)
        .multipliedBy(2.2)
        .toNumber();
      setFee(feeIntermediate);
    }
    getEstimatedFee();
  }, []);

  const { account } = useSelector(accountScreenSelector(route));

  return (
    <>
      <View style={styles.root}>
        <View style={styles.container}>
          <Text color="#949494" fontSize={4}>
            <Trans i18nKey="hedera.stake.flow.stake.amount" />
          </Text>
          <View style={styles.textContainer}>
            <View style={styles.letterIcon}>
              <Text fontSize={10}>H</Text>
            </View>
            <Text color="#FFFFFF" fontSize={4}>
              {account?.balance.dividedBy(100_000_000).toNumber().toFixed(8)}{" "}
              HBAR
            </Text>
          </View>
        </View>

        <View style={styles.container}>
          <Text color="#949494" fontSize={4}>
            <Trans i18nKey="hedera.stake.flow.stake.type" />
          </Text>

          <View style={styles.textContainer}>
            <Text marginRight={3} color="#FFFFFF" fontSize={14}>
              {transaction.staked?.nodeId != null ? (
                <Trans i18nKey="hedera.stake.flow.stake.nodeType" />
              ) : (
                <Trans i18nKey="hedera.stake.flow.stake.accountType" />
              )}
            </Text>
            <View style={styles.chevronContainer}>
              <Icons.ChevronRightMedium color="#949494" size={24} />
            </View>
          </View>
        </View>

        <View style={styles.container}>
          <Text color="#949494" fontSize={4}>
            {transaction.staked?.nodeId != null ? (
              <Trans i18nKey="hedera.stake.flow.stake.node" />
            ) : (
              <Trans i18nKey="hedera.stake.flow.stake.account" />
            )}
          </Text>

          <View style={styles.textContainer}>
            <View style={styles.letterIcon}>
              <Text fontSize={10}>H</Text>
            </View>
            <Text marginRight={3} color="#FFFFFF" fontSize={14}>
              {transaction.staked?.nodeId != null
                ? nodeDescription
                : transaction.staked?.accountId}
            </Text>
            <View style={styles.chevronContainer}>
              <Icons.ChevronRightMedium color="#949494" size={24} />
            </View>
          </View>
        </View>

        <View style={styles.container}>
          <Text color="#949494" fontSize={4}>
            <Trans i18nKey="hedera.stake.flow.stake.totalFees" />
          </Text>

          <View style={styles.textContainer}>
            <Text color="#FFFFFF" fontSize={14}>
              {fee.toFixed(4)} HBAR
            </Text>
            <Text style={styles.feeDollars} color="#949494" fontSize={14}>
              $0.00022
            </Text>
          </View>
        </View>
      </View>

      {/* Continue button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <Button
          event="Hedera StepStakingStartedContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="hedera.common.continue" />}
          type="primary"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 32,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#232425",
    borderRadius: 8,
  },
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    color: "#FFFFFF",
  },
  textContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  letterIcon: {
    marginRight: 8,
    height: 16,
    width: 16,
    backgroundColor: "#717070",
    borderRadius: 100,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  chevronContainer: {
    height: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  feeDollars: {
    marginLeft: 6,
  },
  footer: {
    marginTop: 32,
    marginHorizontal: 16,
  },
});

export default StepSummary;
