import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";

import { ScreenName } from "../../../../const";

import Button from "../../../../components/Button";

import type {
  Transaction,
  HederaAccount,
} from "@ledgerhq/live-common/families/hedera/types";
import { StackNavigatorProps } from "../../../../components/RootNavigator/types/helpers";
import { HederaStakeFlowParamList } from "../types";

// type RouteParams = {
//   account: HederaAccount;
//   transaction: Transaction;
// };

type Props = StackNavigatorProps<HederaStakeFlowParamList, ScreenName.HederaStakeSummary>;

function StepSummary({ navigation, route }: Props) {
  const {
    params: { transaction },
  } = route;
  const { colors } = useTheme();

  const onNext = () => {
    navigation.navigate(ScreenName.HederaStakeSelectDevice, {
      ...route.params,
      transaction,
    });
  };

  return (
    <>
      <View style={styles.root}>
        {/* Stake to ... */}
        <View style={styles.container}>
          <Text color="palette.text.shade40" fontSize={4}>
            <Trans i18nKey="hedera.stake.flow.stake.to" />
          </Text>

          {/* ... node */}
          {transaction.staked?.nodeId != null ? (
            <Text color="palette.text.shade100" fontSize={4}>
              <Trans i18nKey="hedera.common.node" /> {transaction.staked.nodeId}
            </Text>
          ) : null}

          {/* ... account */}
          {transaction.staked?.accountId != null ? (
            <Text color="palette.text.shade100" fontSize={4}>
              <Trans i18nKey="hedera.common.account" />{" "}
              {transaction.staked?.accountId}
            </Text>
          ) : null}
        </View>

        {/* Receive rewards? */}
        <View style={styles.container}>
          <Text color="palette.text.shade40" fontSize={4}>
            <Trans i18nKey="hedera.stake.flow.summary.receiveRewards" />
          </Text>

          <Text color="palette.text.shade100" fontSize={4}>
            {!transaction.staked?.declineRewards ? (
              <Trans i18nKey="hedera.common.yes" />
            ) : (
              <Trans i18nKey="hedera.common.no" />
            )}
          </Text>
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
          event="Hedera StepStakingInfoContinueBtn"
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
  },
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  footer: {
    marginTop: 32,
    marginHorizontal: 16,
  },
});

export default StepSummary;