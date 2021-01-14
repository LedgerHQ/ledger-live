// @flow
import invariant from "invariant";
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";

import type { Transaction } from "@ledgerhq/live-common/lib/families/cosmos/types";

import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  getMainAccount,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";

import { useCosmosMappedDelegations } from "@ledgerhq/live-common/lib/families/cosmos/react";

import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { ScreenName } from "../../../const";
import Item from "../shared/Item";

type RouteParams = {
  accountId: string,
  transaction: Transaction,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

function ClaimRewardsSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account required");

  const mainAccount = getMainAccount(account, undefined);
  const bridge = getAccountBridge(account, undefined);

  const { cosmosResources } = mainAccount;

  invariant(cosmosResources, "cosmosResources required");

  const { transaction } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);

    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "claimReward",
        validators: [],
        /** @TODO remove this once the bridge handles it */
        recipient: mainAccount.freshAddress,
      }),
    };
  });

  invariant(
    transaction && transaction.validators,
    "transaction and validators required",
  );

  const unit = getAccountUnit(account);

  const delegations = useCosmosMappedDelegations(mainAccount, "claimReward");

  const onSelect = useCallback(
    (validator, value) => {
      const tx = bridge.updateTransaction(transaction, {
        validators: [{ address: validator.validatorAddress, amount: value }],
      });
      navigation.navigate(ScreenName.CosmosClaimRewardsMethod, {
        ...route.params,
        transaction: tx,
        validator,
        value,
      });
    },
    [navigation, route.params, transaction, bridge],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <Item
        disabled={false}
        value={item.pendingRewards}
        unit={unit}
        item={item}
        onSelect={onSelect}
      />
    ),
    [unit, onSelect],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.main}>
        <FlatList
          style={styles.list}
          keyExtractor={d => d.validatorAddress}
          data={delegations}
          renderItem={renderItem}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  list: { width: "100%" },
});

export default ClaimRewardsSelectValidator;
