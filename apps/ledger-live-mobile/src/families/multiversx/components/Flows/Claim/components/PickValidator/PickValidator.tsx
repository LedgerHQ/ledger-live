import React, { useMemo, useCallback } from "react";
import { View, FlatList } from "react-native";
import { useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/coin-framework/account";

import BigNumber from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";

import { ScreenName } from "~/const";
import Item from "./components/Item";

import type { onSelectType, PickValidatorPropsType } from "./types";

import styles from "./styles";
import { useAccountUnit } from "~/hooks/useAccountUnit";

/*
 * Handle the component declaration.
 */

const PickValidator = (props: PickValidatorPropsType) => {
  const { navigation, route } = props;
  const { account, delegations } = route.params;
  const { colors } = useTheme();

  const mainAccount = getMainAccount(account, undefined);
  const bridge = getAccountBridge(account, undefined);
  const unit = useAccountUnit(account);

  /*
   * Initialize a new transaction on mount and set the mode to "claimRewards".
   */

  const { transaction } = useBridgeTransaction(() => ({
    account,
    transaction: bridge.updateTransaction(bridge.createTransaction(mainAccount), {
      mode: "claimRewards",
    }),
  }));

  /*
   * Filter the displayed delegations to only include those with rewards bigger than zero.
   */

  const data = useMemo(
    () =>
      delegations.filter(delegation => new BigNumber(delegation.claimableRewards).isGreaterThan(0)),
    [delegations],
  );

  /*
   * Upon selecting an item, navigate to the next panel of the stack and pass along the necessary data.
   */

  const onSelect = useCallback(
    (validator: onSelectType["validator"], value: onSelectType["value"]) => {
      if (validator) {
        navigation.navigate(ScreenName.MultiversXClaimRewardsMethod, {
          value,
          account,
          recipient: validator.contract,
          name: validator.identity.name || validator.contract,
          transaction: bridge.updateTransaction(transaction, {
            recipient: validator.contract,
            amount: new BigNumber(value),
          }),
        });
      }
    },
    [navigation, transaction, bridge, account],
  );

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.main}>
        <FlatList
          style={styles.list}
          data={data}
          keyExtractor={delegation =>
            `${delegation.address}-${delegation.userActiveStake}-${delegation.claimableRewards}`
          }
          renderItem={props => <Item unit={unit} onSelect={onSelect} {...props} />}
        />
      </View>
    </View>
  );
};

export default PickValidator;
