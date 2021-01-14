// @flow
import invariant from "invariant";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";

import type { Account } from "@ledgerhq/live-common/lib/types";

import {
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import Info from "../../../icons/Info";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import { ScreenName, NavigatorName } from "../../../const";

type Props = {
  account: Account,
};

const RewardsSection = ({ account }: Props) => {
  const { colors } = useTheme();
  invariant(
    account && account.algorandResources,
    "algorand resources required",
  );
  const { rewards } = account.algorandResources;

  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onRewardsInfoClick = useCallback(() => {
    navigation.navigate(NavigatorName.AlgorandClaimRewardsFlow, {
      screen: ScreenName.AlgorandClaimRewardsInfo,
      params: { accountId: account.id },
    });
  }, [navigation, account]);

  const onRewardsClick = useCallback(() => {
    navigation.navigate(NavigatorName.AlgorandClaimRewardsFlow, {
      screen: ScreenName.AlgorandClaimRewardsStarted,
      params: { accountId: account.id },
    });
  }, [account, navigation]);

  const rewardsDisabled = rewards.lte(0);

  return (
    <View style={styles.root}>
      <AccountSectionLabel
        name={t("algorand.claimRewards.title")}
        icon={<Info size={16} color={colors.darkBlue} />}
        onPress={onRewardsInfoClick}
      />
      <View style={[styles.rewardSection, { backgroundColor: colors.card }]}>
        <View style={styles.labelSection}>
          <LText semiBold style={styles.title}>
            <CurrencyUnitValue unit={unit} value={rewards} />
          </LText>
          <LText semiBold style={styles.subtitle} color="grey">
            {currency && <CounterValue currency={currency} value={rewards} />}
          </LText>
        </View>
        <Button
          containerStyle={styles.collectButton}
          type="primary"
          event=""
          disabled={rewardsDisabled}
          onPress={onRewardsClick}
          title={t("algorand.claimRewards.button")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  rewardSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  collectButton: {
    flexBasis: "auto",
    flexGrow: 0.1,
  },
  labelSection: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: "left",
  },
});

const Rewards = ({ account }: Props) => {
  const { algorandResources } = account;

  if (!algorandResources) return null;

  return <RewardsSection account={account} />;
};

export default Rewards;
