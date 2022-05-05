import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";
import { isAccountDelegating } from "@ledgerhq/live-common/lib/families/tezos/bakers";
import { Text } from "@ledgerhq/native-ui";
import { ScreenName } from "../../const";
import IlluStaking from "./IlluStaking";
import Button from "../../components/wrappedUi/Button";

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
    marginRight: 90,
  },
  btn: {
    marginTop: 16,
    width: 160,
  },
});

type Props = {
  account: AccountLike;
  parentAccount?: Account;
};

export default function TezosAccountHeader({ account, parentAccount }: Props) {
  const navigation = useNavigation();

  const onEarnRewards = useCallback(() => {
    navigation.navigate(ScreenName.TezosDelegationFlow, {
      screen: "DelegationStarted",
      params: {
        accountId: account.id,
        parentId: parentAccount ? parentAccount.id : undefined,
      },
    });
  }, [navigation, account, parentAccount]);

  const mainAccount = getMainAccount(account, parentAccount);
  const backgroundColor = getCurrencyColor(mainAccount.currency);

  if (isAccountDelegating(account) || account.type !== "Account") return null;
  return (
    <View style={[styles.banner, { backgroundColor }]}>
      <Text fontWeight={"semiBold"} style={styles.title} color="white">
        <Trans i18nKey="tezos.AccountHeader.title" />
      </Text>
      <Button
        style={styles.btn}
        type="main"
        event="EarnRewards"
        eventProperties={{ currencyId: mainAccount.currency.id }}
        onPress={onEarnRewards}
      >
        <Trans i18nKey="tezos.AccountHeader.btn" />
      </Button>
      <IlluStaking style={styles.bannerImage} />
    </View>
  );
}
