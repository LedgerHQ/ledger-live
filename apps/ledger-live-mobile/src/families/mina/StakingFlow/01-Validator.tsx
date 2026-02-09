import { MinaAccount, ValidatorInfo } from "@ledgerhq/live-common/families/mina/types";
import { Text } from "@ledgerhq/native-ui";
import type { AccountLike } from "@ledgerhq/types-live";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "~/context/Locale";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/store";
import { accountScreenSelector } from "~/reducers/accounts";
import SelectValidatorSearchBox from "../../tron/VoteFlow/01-SelectValidator/SearchBox";
import { MinaStakingFlowParamList } from "./types";
import ValidatorRow from "./ValidatorRow";

type Props = CompositeScreenProps<
  StackNavigatorProps<MinaStakingFlowParamList, ScreenName.MinaStakingValidator>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

function isMinaAccount(account: AccountLike): account is MinaAccount {
  return account.type === "Account";
}

function StakingValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const [searchQuery, setSearchQuery] = useState("");

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const unit = useAccountUnit(account);
  const minaResources = isMinaAccount(account) ? account.resources : undefined;
  const blockProducers = useMemo(() => {
    return minaResources?.blockProducers || [];
  }, [minaResources?.blockProducers]);

  // Sort validators by stake (highest first) and filter by search
  const validators = useMemo(() => {
    const sorted = [...blockProducers].sort((a, b) => b.stake - a.stake);
    if (!searchQuery) return sorted;
    const searchLower = searchQuery.toLowerCase();
    return sorted.filter(
      v =>
        v.name?.toLowerCase().includes(searchLower) ||
        v.address?.toLowerCase().includes(searchLower),
    );
  }, [blockProducers, searchQuery]);

  const onItemPress = useCallback(
    (validator: ValidatorInfo) => {
      navigation.navigate(ScreenName.MinaStakingSummary, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: ValidatorInfo }) => (
      <ValidatorRow validator={item} onPress={onItemPress} unit={unit} />
    ),
    [onItemPress, unit],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name="SelectValidator"
        flow="stake"
        action="delegation"
        currency="mina"
      />
      <SelectValidatorSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <View style={styles.header}>
        <ValidatorHead />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={validators}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const keyExtractor = (v: ValidatorInfo) => v.address;

const ValidatorHead = () => (
  <View style={styles.validatorHead}>
    <Text style={styles.validatorHeadText} color="smoke" numberOfLines={1} fontWeight="semiBold">
      <Trans i18nKey="delegation.validator" />
    </Text>
    <View style={styles.validatorHeadContainer}>
      <Text style={styles.validatorHeadText} color="smoke" numberOfLines={1} fontWeight="semiBold">
        <Trans i18nKey="mina.delegation.totalStake" />
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
  validatorHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  validatorHeadText: {
    fontSize: 14,
  },
  validatorHeadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default StakingValidator;
