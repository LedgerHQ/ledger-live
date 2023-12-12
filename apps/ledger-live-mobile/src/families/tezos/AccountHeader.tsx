import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useNavigation, ParamListBase, RouteProp } from "@react-navigation/native";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { isAccountDelegating } from "@ledgerhq/live-common/families/tezos/bakers";
import { Text } from "@ledgerhq/native-ui";
import { NavigatorName, ScreenName } from "~/const";
import IlluStaking from "./IlluStaking";
import Button from "~/components/wrappedUi/Button";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Navigation = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.Account>;

const styles = StyleSheet.create({
  banner: {
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
  parentRoute?: RouteProp<ParamListBase, ScreenName>;
};

export default function TezosAccountHeader({ account, parentAccount, parentRoute }: Props) {
  const navigation = useNavigation<Navigation["navigation"]>();

  const onEarnRewards = useCallback(() => {
    navigation.navigate(NavigatorName.TezosDelegationFlow, {
      screen: ScreenName.DelegationStarted,
      params: {
        accountId: account.id,
        parentId: parentAccount ? parentAccount.id : undefined,
        source: parentRoute,
      },
    });
  }, [navigation, account.id, parentAccount, parentRoute]);

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
