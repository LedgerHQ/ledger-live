import invariant from "invariant";
import React, { useCallback } from "react";
import { View, StyleSheet, FlatList, ListRenderItem } from "react-native";
import { useSelector } from "react-redux";
import type {
  CosmosAccount,
  CosmosMappedDelegation,
  CosmosValidatorItem,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount, getAccountUnit } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useCosmosFamilyMappedDelegations } from "@ledgerhq/live-common/families/cosmos/react";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import Item from "../shared/Item";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { CosmosClaimRewardsFlowParamList } from "./types";
import BigNumber from "bignumber.js";

type Props = StackNavigatorProps<
  CosmosClaimRewardsFlowParamList,
  ScreenName.CosmosClaimRewardsValidator
>;

function ClaimRewardsSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account required");
  const mainAccount = getMainAccount(account, undefined) as CosmosAccount;
  const bridge = getAccountBridge(account, undefined);
  const { cosmosResources } = mainAccount;
  invariant(cosmosResources, "cosmosResources required");
  const transaction = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "claimReward",
        validators: [],
      }),
    };
  }).transaction as Transaction;
  invariant(transaction && transaction.validators, "transaction and validators required");
  const unit = getAccountUnit(account);
  const delegations = useCosmosFamilyMappedDelegations(mainAccount, "claimReward");
  const onSelect = useCallback(
    (validator: CosmosValidatorItem, value?: BigNumber | null) => {
      const tx = bridge.updateTransaction(transaction, {
        validators: [
          {
            address: validator.validatorAddress,
            amount: value,
          },
        ],
      });
      navigation.navigate(ScreenName.CosmosClaimRewardsMethod, {
        ...route.params,
        transaction: tx,
        validator,
        value: value as BigNumber,
      });
    },
    [navigation, route.params, transaction, bridge],
  );
  const renderItem: ListRenderItem<CosmosMappedDelegation> = useCallback(
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
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.main}>
        <FlatList
          style={styles.list}
          keyExtractor={d => d.validatorAddress}
          data={delegations}
          renderItem={renderItem}
        />
      </View>
    </View>
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
  list: {
    width: "100%",
  },
});
export default ClaimRewardsSelectValidator;
