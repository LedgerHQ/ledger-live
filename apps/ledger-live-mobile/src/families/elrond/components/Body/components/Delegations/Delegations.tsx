import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { BigNumber } from "bignumber.js";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";

import type { StackNavigationProp } from "@react-navigation/stack";
import type { NavigationType } from "../../../../types";
import type { DelegationsPropsType } from "./types";

import AccountDelegationInfo from "../../../../../../components/AccountDelegationInfo";
import AccountSectionLabel from "../../../../../../components/AccountSectionLabel";
import IlluRewards from "../../../../../../icons/images/Rewards";
import { ScreenName, NavigatorName } from "../../../../../../const";

import { urls } from "../../../../../../config/urls";
import { denominate } from "../../../../helpers/denominate";

import Delegation from "./components/Delegation";
import Right from "./components/Right";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const Delegations = (props: DelegationsPropsType) => {
  const { delegations, validators, account, onDrawer } = props;
  const { t } = useTranslation();

  const navigation: StackNavigationProp<NavigationType> = useNavigation();
  const currency = useMemo(
    () => getAccountCurrency(getMainAccount(account, undefined)),
    [account],
  );

  /*
   * Enabled delegations only if the spendable balance is above 1 EGLD.
   */

  const delegationEnabled = useMemo(
    () =>
      new BigNumber(denominate({ input: String(account.spendableBalance) })).gt(
        1,
      ),
    [account.spendableBalance],
  );

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
   * Return an introductory panel to delegations if the user hasn't previously delegated.
   */

  if (delegations.length === 0) {
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
        RightComponent={
          <Right disabled={!delegationEnabled} onPress={onDelegate} />
        }
      />

      {delegations.map((delegation, index) => (
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
