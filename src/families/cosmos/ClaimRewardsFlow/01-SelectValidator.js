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

import { accountScreenSelector } from "../../../reducers/accounts";
import colors from "../../../colors";
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
    ({ item }) => {
      return (
        <Item
          disabled={false}
          value={item.pendingRewards}
          unit={unit}
          item={item}
          onSelect={onSelect}
        />
      );
    },
    [unit, onSelect],
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.main}>
        <FlatList
          style={styles.list}
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
    backgroundColor: colors.white,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  searchSection: { height: 55, paddingHorizontal: 16 },
  list: { width: "100%" },
  noResult: {
    flex: 1,
    justifyContent: "flex-end",
  },
  header: {
    width: "100%",
    height: 32,
    paddingHorizontal: 16,
    fontSize: 14,
    lineHeight: 32,
    backgroundColor: colors.lightFog,
    color: colors.grey,
  },
  footer: {
    alignSelf: "stretch",
    padding: 16,
    backgroundColor: colors.white,
  },
  labelContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 16,
  },
  assetsRemaining: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 10,
  },
  error: {
    color: colors.alert,
  },
  success: {
    color: colors.success,
  },
});

export default ClaimRewardsSelectValidator;
