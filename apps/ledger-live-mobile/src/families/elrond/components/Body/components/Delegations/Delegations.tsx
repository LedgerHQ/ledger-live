import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { hasMinimumDelegableBalance } from "@ledgerhq/live-common/families/elrond/helpers/hasMinimumDelegableBalance";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import BigNumber from "bignumber.js";
import type { StackNavigationProp } from "@react-navigation/stack";

import type { NavigationType } from "../../../../types";
import type { DelegationsPropsType } from "./types";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import IlluRewards from "~/icons/images/Rewards";
import { ScreenName, NavigatorName } from "~/const";

import { urls } from "~/utils/urls";

import Delegation from "./components/Delegation";
import Right from "./components/Right";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const Delegations = (props: DelegationsPropsType) => {
  const { delegations, validators, account, onDrawer } = props;
  const { t } = useTranslation();

  const zeroBalance = account.spendableBalance.isZero();
  const navigation: StackNavigationProp<NavigationType> = useNavigation();
  const currency = useMemo(() => getAccountCurrency(getMainAccount(account, undefined)), [account]);

  /*
   * Enabled delegations only if the spendable balance is above 1 EGLD.
   */

  const delegationEnabled = hasMinimumDelegableBalance(account);

  /*
   * Trigger the delegation flow, opening conditionally a screen based on the amount of existing delegations.
   */

  const onDelegate = useCallback(() => {
    const screen =
      delegations.length === 0
        ? ScreenName.ElrondDelegationStarted
        : ScreenName.ElrondDelegationValidator;

    navigation.navigate(NavigatorName.ElrondDelegationFlow, {
      screen,
      params: { validators, account },
    });
  }, [navigation, account, delegations, validators]);

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
   * Get the total delegated amount, from all active delegations.
   */

  const delegatedAmount = useMemo(
    () =>
      delegations.reduce(
        (total, delegation) => total.plus(delegation.userActiveStake),
        new BigNumber(0),
      ),
    [delegations],
  );

  /*
   * Filter the delegations that either have available claimable rewards or have delegated stake.
   */

  const items = useMemo(
    () =>
      delegations.filter(
        delegation =>
          new BigNumber(delegation.userActiveStake).isGreaterThan(0) ||
          new BigNumber(delegation.claimableRewards).isGreaterThan(0),
      ),
    [delegations],
  );

  /*
   * Don't display anything if the user doesn't have any balance to spend.
   */

  if (delegatedAmount.eq(0) && rewardsAmount.eq(0) && zeroBalance) {
    return null;
  }

  /*
   * Return an introductory panel to delegations if the user hasn't previously delegated.
   */

  if (delegatedAmount.isEqualTo(0) && rewardsAmount.isEqualTo(0)) {
    return (
      <AccountDelegationInfo
        title={t("account.delegation.info.title")}
        image={<IlluRewards style={styles.illustration} />}
        infoUrl={urls.elrondStaking}
        infoTitle={t("elrond.delegation.info")}
        onPress={onDelegate}
        ctaTitle={t("account.delegation.info.cta")}
        description={t("elrond.delegation.delegationEarn", {
          name: account.currency.name,
        })}
      />
    );
  }

  /*
   * Render the list of delegations if there are any available.
   */

  return (
    <View style={styles.wrapper}>
      <AccountSectionLabel
        name={t("account.delegation.sectionLabel")}
        RightComponent={<Right disabled={!delegationEnabled} onPress={onDelegate} />}
      />

      {items.map((delegation, index) => (
        <Delegation
          key={`delegation-${index}`}
          last={delegations.length === index + 1}
          onDrawer={onDrawer}
          currency={currency}
          {...delegation}
        />
      ))}
    </View>
  );
};

export default Delegations;
