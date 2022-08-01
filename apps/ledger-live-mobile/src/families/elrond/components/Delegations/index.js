// @flow
import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { BigNumber } from "bignumber.js";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";

import { urls } from "../../../../config/urls";
import { ScreenName, NavigatorName } from "../../../../const";

import AccountDelegationInfo from "../../../../components/AccountDelegationInfo";
import AccountSectionLabel from "../../../../components/AccountSectionLabel";
import IlluRewards from "../../../../icons/images/Rewards";

import Delegation from "./components/Delegation/index.jsx";
import Right from "./components/Right/index.jsx";

import { denominate } from "../../helpers";

const styles = StyleSheet.create({
  illustration: {
    alignSelf: "center",
    marginBottom: 16,
  },
  wrapper: {
    marginBottom: 16,
  },
  delegationsWrapper: {
    borderRadius: 4,
  },
});

const Delegations = (props: any) => {
  const { delegations, validators, account, onDrawer } = props;
  const { t } = useTranslation();

  const navigation = useNavigation();
  const currency = useMemo(() => getAccountCurrency(getMainAccount(account)), [
    account,
  ]);
  const delegationEnabled = useMemo(
    () => BigNumber(denominate({ input: account.balance })).gt(1),
    [account.balance],
  );

  const onDelegate = useCallback(
    (validator, amount, meta) => {
      if (validator && amount && onDrawer) {
        onDrawer({
          source: "delegation",
          validator,
          amount,
          meta: {
            ...meta,
            delegations,
          },
        });
      }

      if (!validator || !amount) {
        navigation.navigate(NavigatorName.ElrondDelegationFlow, {
          screen: ScreenName.ElrondDelegationStarted,
          params: {
            accountId: account.id,
            validators,
            delegations,
            account,
          },
        });
      }
    },
    [navigation, account, delegations, validators, onDrawer],
  );

  if (delegations.length === 0) {
    return (
      <AccountDelegationInfo
        title={t("account.delegation.info.title")}
        image={<IlluRewards style={styles.illustration} />}
        description={t("elrond.delegation.delegationEarn", {
          name: account.currency.name,
        })}
        infoUrl={urls.elrondStaking}
        infoTitle={t("elrond.delegation.info")}
        onPress={() => onDelegate()}
        ctaTitle={t("account.delegation.info.cta")}
      />
    );
  }

  return (
    <View style={styles.wrapper}>
      <AccountSectionLabel
        name={t("account.delegation.sectionLabel")}
        RightComponent={
          <Right disabled={!delegationEnabled} onPress={() => onDelegate()} />
        }
      />

      {delegations.map((delegation, index) => (
        <Delegation
          key={`delegation-${index}`}
          last={delegations.length === index + 1}
          {...{ ...delegation, onDelegate, currency }}
        />
      ))}
    </View>
  );
};

export default Delegations;
