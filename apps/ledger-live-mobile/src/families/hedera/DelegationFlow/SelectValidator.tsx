import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { FlatList, StyleSheet, View } from "react-native";
import invariant from "invariant";
import { useTheme } from "@react-navigation/native";
import { AccountLike } from "@ledgerhq/types-live";
import { Icons, Text } from "@ledgerhq/native-ui";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/color";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { TrackScreen } from "~/analytics";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Touchable from "~/components/Touchable";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import ValidatorIcon from "~/families/hedera/shared/ValidatorIcon";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import { accountScreenSelector } from "~/reducers/accounts";
import type { HederaDelegationFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<HederaDelegationFlowParamList, ScreenName.DelegationSelectValidator>
>;

const keyExtractor = (v: HederaValidator) => v.address;

export default function SelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const [searchQuery, setSearchQuery] = useState("");

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const validators = useHederaValidators(account.currency, searchQuery);

  const onItemPress = useCallback(
    (validator: HederaValidator) => {
      navigation.navigate(ScreenName.DelegationSummary, {
        ...route.params,
        validator,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: HederaValidator }) => (
      <ValidatorRow account={account} validator={item} onPress={onItemPress} />
    ),
    [onItemPress, account],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="DelegationFlow"
        name="SelectValidator"
        flow="stake"
        action="delegation"
        currency="hedera"
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

const ValidatorHead = () => (
  <View style={styles.validatorHead}>
    <Text style={styles.validatorHeadText} color="smoke" numberOfLines={1} fontWeight="semiBold">
      <Trans i18nKey="delegation.validator" />
    </Text>
    <View style={styles.validatorHeadContainer}>
      <Text style={styles.validatorHeadText} color="smoke" numberOfLines={1} fontWeight="semiBold">
        <Trans i18nKey="hedera.delegation.steps.validator.totalStake" />
      </Text>
    </View>
  </View>
);

const ValidatorRow = ({
  onPress,
  validator,
  account,
}: {
  onPress: (_: HederaValidator) => void;
  validator: HederaValidator;
  account: AccountLike;
}) => {
  const unit = useAccountUnit(account);
  const currency = getAccountCurrency(account);
  const color = getCurrencyColor(currency);

  const handlePress = useCallback(() => {
    onPress(validator);
  }, [validator, onPress]);

  return (
    <Touchable
      event="DelegationFlowChoseValidator"
      eventProperties={{ validatorName: validator.name }}
      onPress={handlePress}
    >
      <View style={styles.validator}>
        <ValidatorIcon color={color} size={32} validatorName={validator.name} />
        <View style={styles.validatorBody}>
          <Text numberOfLines={1} fontWeight="semiBold" style={styles.validatorName}>
            {validator.name}
          </Text>
        </View>
        <View style={{ flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
          <Text
            fontWeight="semiBold"
            numberOfLines={1}
            style={[styles.validatorYield]}
            color="smoke"
          >
            <Text fontWeight="semiBold" numberOfLines={1}>
              <CurrencyUnitValue showCode unit={unit} value={validator.activeStake} />
            </Text>
          </Text>
          {validator.overstaked ? (
            <View style={styles.overstakedWarning}>
              <Icons.Warning size="XS" color="palette.warning.c70" style={styles.overstakedIcon} />
              <Text numberOfLines={1} fontSize={10} color="palette.warning.c70">
                <Trans i18nKey="hedera.delegation.steps.validator.rowSubtitleOverstaked" />
              </Text>
            </View>
          ) : (
            <Text numberOfLines={1} fontSize={10}>
              <Trans
                i18nKey="hedera.delegation.steps.validator.rowSubtitlePercentage"
                values={{ percentage: validator.activeStakePercentage }}
              />
            </Text>
          )}
        </View>
      </View>
    </Touchable>
  );
};

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
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
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
  validator: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  validatorBody: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
  },
  validatorName: {
    fontSize: 14,
  },
  validatorYield: {
    fontSize: 14,
  },
  overstakedWarning: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  overstakedIcon: {
    maxWidth: 10,
  },
});
