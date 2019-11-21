// @flow
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { withNavigation } from "react-navigation";
import { StyleSheet, View } from "react-native";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import { isAccountDelegating } from "@ledgerhq/live-common/lib/families/tezos/bakers";
import colors from "../../colors";
import IlluStaking from "./IlluStaking";
import Button from "../../components/Button";
import LText from "../../components/LText";

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    marginBottom: 0,
    minHeight: 128,
    padding: 16,
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
  },
  bannerImage: {
    position: "absolute",
    right: 24,
    bottom: -38,
  },
  title: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 21,
    marginRight: 90,
  },
  btn: {
    marginTop: 16,
    width: 140,
  },
});

const TezosAccountHeader = ({
  account,
  parentAccount,
  navigation,
}: {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: *,
}) => {
  const onEarnRewards = useCallback(() => {
    navigation.navigate("DelegationStarted", {
      accountId: account.id,
      parentId: parentAccount ? parentAccount.id : undefined,
    });
  }, [navigation, account, parentAccount]);

  const mainAccount = getMainAccount(account, parentAccount);
  const backgroundColor = getCurrencyColor(mainAccount.currency);

  if (isAccountDelegating(account) || account.type !== "Account") return null;
  return (
    <View style={[styles.banner, { backgroundColor }]}>
      <LText semiBold style={styles.title}>
        <Trans i18nKey="tezos.AccountHeader.title" />
      </LText>
      <Button
        containerStyle={styles.btn}
        type="negativePrimary"
        title={<Trans i18nKey="tezos.AccountHeader.btn" />}
        event="EarnRewards"
        eventProperties={{ currencyId: mainAccount.currency.id }}
        onPress={onEarnRewards}
      />
      <IlluStaking style={styles.bannerImage} />
    </View>
  );
};

export default withNavigation(TezosAccountHeader);
