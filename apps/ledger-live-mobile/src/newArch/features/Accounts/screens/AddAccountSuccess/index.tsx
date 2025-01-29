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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
            backgroundColor="neutral.c30"
            borderRadius="12px"
            padding="12px"
            width={343}
          >
            <AccountItem account={item as Account} balance={item.spendableBalance} />
            <Icons.ChevronRight size="M" color={colors.primary.c100} />
          </Flex>
        </TouchableOpacity>
      </Animated.View>
    ),
    [colors.primary, goToAccounts, animatedSelectableAccount],
  );

  const keyExtractor = useCallback((item: AccountLikeEnhanced) => item?.id, []);

  const statusColor = colors.neutral.c100;

  return (
    <SafeAreaView edges={["left", "right"]} isFlex>
      <TrackScreen category="AddAccounts" name="Success" currencyName={currency?.name} />
      <VerticalGradientBackground stopColor={getCurrencyColor(currency)} />
      <Flex alignItems={"center"} style={styles.root}>
        <View style={[styles.iconWrapper, { backgroundColor: rgba(statusColor, 0.1) }]}>
          <Circle size={24}>
            <Icons.CheckmarkCircleFill size="L" color={statusColor} />
          </Circle>
        </View>
        <Text style={styles.title}>{t("addAccounts.added", { count: accountsToAdd.length })}</Text>
      </Flex>
      <Flex flex={1} justifyContent="center" alignItems="center">
        <FlatList
          testID="added-accounts-list"
          data={accountsToAdd}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          style={{ paddingHorizontal: 16 }}
        />
      </Flex>
      <Flex mb={insets.bottom + 2} px={6} rowGap={6}>
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
    marginTop: 32,
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
