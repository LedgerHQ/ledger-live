import React, { Fragment, useCallback, useMemo } from "react";
import { useNavigation, useTheme } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";

import { ScreenName, NavigatorName } from "../../../../const";
import AccountSectionLabel from "../../../../components/AccountSectionLabel";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
import CounterValue from "../../../../components/CounterValue";
import Button from "../../../../components/Button";
import LText from "../../../../components/LText";

const styles = StyleSheet.create({
  rewardsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    padding: 16,
    marginBottom: 16,
    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  subLabel: {
    fontSize: 14,
    flex: 1,
  },
  column: {
    flexDirection: "column",
  },
});

const Rewards = (props: any) => {
  const { account, value, delegations } = props;
  const { t } = useTranslation();
  const { colors } = useTheme();

  const navigation = useNavigation();
  const unit = getAccountUnit(account);
  const currency = useMemo(() => getAccountCurrency(getMainAccount(account)), [
    account,
  ]);

  const onCollect = useCallback(
    () =>
      navigation.navigate(NavigatorName.ElrondClaimRewardsFlow, {
        screen: ScreenName.ElrondClaimRewardsValidator,
        params: {
          accountId: account.id,
          delegations,
        },
      }),
    [navigation, account.id, delegations],
  );

  return (
    <Fragment>
      <AccountSectionLabel name={t("account.claimReward.sectionLabel")} />

      <View style={[styles.rewardsWrapper, { backgroundColor: colors.card }]}>
        <View style={styles.column}>
          <LText semiBold={true} style={styles.label}>
            <CurrencyUnitValue {...{ value, unit }} />
          </LText>

          <LText semiBold={true} style={styles.subLabel} color="grey">
            <CounterValue withPlaceholder={true} {...{ currency, value }} />
          </LText>
        </View>

        <Button
          event="Elrond AccountClaimRewardsBtn Click"
          onPress={onCollect}
          type="primary"
          title={t("account.claimReward.cta")}
        />
      </View>
    </Fragment>
  );
};

export default Rewards;
