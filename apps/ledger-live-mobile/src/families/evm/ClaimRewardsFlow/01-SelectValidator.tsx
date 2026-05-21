import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { FlatList, ListRenderItem, StyleSheet, TouchableOpacity, View } from "react-native";
import BigNumber from "bignumber.js";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useEvmFamilyMappedDelegations } from "@ledgerhq/live-common/families/evm/staking/react";
import {
  isStakingAccount,
  StakingAccount,
  StakingMappedDelegation,
  StakingValidatorItem,
} from "@ledgerhq/live-common/families/evm/staking/types";
import { ScreenName } from "~/const";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import ArrowRight from "~/icons/ArrowRight";
import ValidatorImage from "~/families/evm/shared/ValidatorImage";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { EvmClaimRewardsFlowParamList } from "./types";

type Navigation = StackNavigatorProps<
  EvmClaimRewardsFlowParamList,
  ScreenName.EvmClaimRewardsValidator
>;

function ClaimRewardsSelectValidator() {
  const navigation = useNavigation<Navigation["navigation"]>();
  const route = useRoute<Navigation["route"]>();
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  invariant(account, "account required");
  invariant(account.type === "Account", "account must be of type Account");
  invariant(isStakingAccount(account), "evm staking account required");

  const mainAccount = getMainAccount(account, undefined) as StakingAccount;
  const unit = useAccountUnit(mainAccount);

  const allDelegations = useEvmFamilyMappedDelegations(mainAccount);
  const claimable = useMemo(
    () => allDelegations.filter(d => d.pendingRewards?.gt(0)),
    [allDelegations],
  );

  const onSelect = useCallback(
    (validator: StakingValidatorItem, value: BigNumber) => {
      navigation.navigate(ScreenName.EvmClaimRewardsClaim, {
        ...route.params,
        validator,
        value,
      });
    },
    [navigation, route.params],
  );

  const renderItem: ListRenderItem<StakingMappedDelegation> = useCallback(
    ({ item }) => {
      const validator = item.validator;
      if (!validator) return null;
      const pending = item.pendingRewards ?? new BigNumber(0);
      return (
        <TouchableOpacity style={styles.row} onPress={() => onSelect(validator, pending)}>
          <ValidatorImage isLedger={false} name={validator.name} size={32} />
          <View style={styles.rowText}>
            <LText semiBold numberOfLines={1} style={styles.validatorName}>
              {validator.name}
            </LText>
            <LText color="grey" style={styles.rewardValue}>
              <CurrencyUnitValue unit={unit} value={pending} showCode />
            </LText>
          </View>
          <ArrowRight size={16} color={colors.grey} />
        </TouchableOpacity>
      );
    },
    [colors.grey, unit, onSelect],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        style={styles.list}
        keyExtractor={d => d.validatorAddress}
        data={claimable}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
  },
  validatorName: {
    fontSize: 14,
  },
  rewardValue: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default ClaimRewardsSelectValidator;
