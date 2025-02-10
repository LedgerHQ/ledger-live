import { Flex, Icons, rgba, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AccountItem from "../../components/AccountsListView/components/AccountItem";
import { AccountLikeEnhanced } from "../ScanDeviceAccounts/types";
import { Account } from "@ledgerhq/types-live";
import SafeAreaView from "~/components/SafeAreaView";
import Circle from "~/components/Circle";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import VerticalGradientBackground from "../../components/VerticalGradientBackground";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useNavigation } from "@react-navigation/core";
import useAnimatedStyle from "../ScanDeviceAccounts/components/ScanDeviceAccountsFooter/useAnimatedStyle";
import AddFundsButton from "../../components/AddFundsButton";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import { AddAccountContexts } from "../AddAccount/enums";

type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsSuccess>
>;

export default function AddAccountsSuccess({ route }: Props) {
  const { colors, space } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { animatedSelectableAccount } = useAnimatedStyle();
  const { currency, accountsToAdd, onCloseNavigation, context } = route.params || {};

  const goToAccounts = useCallback(
    (accountId: string) => () => {
      if (context === AddAccountContexts.AddAccounts)
        navigation.navigate(ScreenName.Account, {
          accountId,
        });
      else
        navigation.navigate(NavigatorName.ReceiveFunds, {
          screen: ScreenName.ReceiveConfirmation,
          params: {
            ...route.params,
            accountId,
          },
        });
    },
    [navigation, route.params, context],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AccountLikeEnhanced>) => (
      <Animated.View style={[animatedSelectableAccount]}>
        <TouchableOpacity onPress={goToAccounts(item.id)}>
          <Flex
            flexDirection="row"
            alignItems="center"
            borderRadius={space[4]}
            padding={space[6]}
            backgroundColor="opacityDefault.c05"
            width="100%"
          >
            <AccountItem account={item as Account} balance={item.balance} />
            <Icons.ChevronRight size="M" color={colors.primary.c100} />
          </Flex>
        </TouchableOpacity>
      </Animated.View>
    ),
    [animatedSelectableAccount, goToAccounts, space, colors.primary.c100],
  );

  const keyExtractor = useCallback((item: AccountLikeEnhanced) => item?.id, []);

  const statusColor = colors.neutral.c100;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="AddAccounts" name="Success" currencyName={currency?.name} />
      <VerticalGradientBackground stopColor={getCurrencyColor(currency)} />
      <Flex alignItems="center" style={styles.root} pt={space[7]}>
        <View style={[styles.iconWrapper, { backgroundColor: rgba(statusColor, 0.1) }]}>
          <Circle size={24}>
            <Icons.CheckmarkCircleFill size="L" color={statusColor} />
          </Circle>
        </View>
        <Text style={styles.title} textAlign="center" width="60%">
          {t("addAccounts.added", { count: accountsToAdd.length })}
        </Text>
      </Flex>
      <Flex flex={1} justifyContent="center" alignItems="center">
        <FlatList
          testID="added-accounts-list"
          data={accountsToAdd}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: space[4] }} />}
          style={{ paddingHorizontal: space[4], width: "100%" }}
        />
      </Flex>
      <Flex px={6} rowGap={6}>
        <AddFundsButton
          accounts={accountsToAdd}
          currency={currency}
          sourceScreenName={ScreenName.AddAccountsSuccess}
        />
        <CloseWithConfirmation
          showButton
          buttonText={t("addAccounts.addAccountsSuccess.ctaClose")}
          onClose={onCloseNavigation}
        />
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 100,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 16,
    fontSize: 24,
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
