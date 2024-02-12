import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import BigNumber from "bignumber.js";

import type { StackNavigationProp } from "@react-navigation/stack";
import type { NavigationType } from "../../../../types";
import type { RewardsPropsType } from "./types";

import AccountSectionLabel from "~/components/AccountSectionLabel";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import Button from "~/components/Button";
import LText from "~/components/LText";
import { ScreenName, NavigatorName } from "~/const";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const Rewards = (props: RewardsPropsType) => {
  const { account, delegations } = props;
  const { t } = useTranslation();

  const unit = getAccountUnit(account);
  const navigation: StackNavigationProp<NavigationType> = useNavigation();
  const currency = getAccountCurrency(getMainAccount(account, undefined));

  /*
   * When calling the collect callback, navigate to the appropriate screen and pass the data along.
   */

  const onCollect = useCallback(
    () =>
      navigation.navigate(NavigatorName.ElrondClaimRewardsFlow, {
        screen: ScreenName.ElrondClaimRewardsValidator,
        params: { account, delegations },
      }),
    [navigation, account, delegations],
  );

  /*
   * Get the total amount of rewards, cumulated, from all active delegations.
   */

  const rewardsAmount = useMemo(
    () =>
      delegations.reduce(
        (total, delegation) => total.plus(delegation.claimableRewards),
        new BigNumber(0),
      ),
    [delegations],
  );

  /*
   * Don't render anything if the total cumulated rewards from all active delegations is zero.
   */

  if (rewardsAmount.isEqualTo(0)) {
    return null;
  }

  /*
   * Return the rendered component.
   */

  return (
    <View>
      <AccountSectionLabel name={t("account.claimReward.sectionLabel")} />

      <View style={styles.rewardsWrapper}>
        <View style={styles.column}>
          <LText semiBold={true} style={styles.label}>
            <CurrencyUnitValue value={rewardsAmount} unit={unit} />
          </LText>

          <LText semiBold={true} style={styles.subLabel} color="grey">
            <CounterValue withPlaceholder={true} value={rewardsAmount} currency={currency} />
          </LText>
        </View>

        <Button
          event="Elrond AccountClaimRewardsBtn Click"
          onPress={onCollect}
          type="primary"
          title={t("account.claimReward.cta")}
        />
      </View>
    </View>
  );
};

export default Rewards;
