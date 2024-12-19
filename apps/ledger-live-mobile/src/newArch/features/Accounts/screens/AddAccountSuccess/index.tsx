import { Button, Flex, Icons } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ListRenderItemInfo, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { rgba } from "../../../../../colors";
import { TrackScreen } from "~/analytics";
import LText from "~/components/LText";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AccountItem from "../../components/AccountsListView/components/AccountItem";
import { AccountLikeEnhanced } from "../ScanDeviceAccounts/types";
import { Account } from "@ledgerhq/types-live";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeAreaView from "~/components/SafeAreaView";
import Circle from "~/components/Circle";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";

// TODO: Add business logic (0 funded account warning section) and Poolish (UI + gradient like figma design) & add integration tests in the following ticket https://ledgerhq.atlassian.net/browse/LIVE-13983

type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsSuccess>
>;

export default function AddAccountsSuccess({ route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { currency, fundedAccounts } = route.params || {};

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AccountLikeEnhanced>) => (
      <TouchableOpacity>
        <Flex
          flex={1}
          flexDirection="row"
          height={56}
          alignItems="center"
          backgroundColor="neutral.c30"
          borderRadius={"12px"}
          padding={"12px"}
          columnGap={12}
        >
          <AccountItem account={item as Account} balance={item.spendableBalance} />
          <Icons.ChevronRight size="M" color={colors.primary} />
        </Flex>
      </TouchableOpacity>
    ),
    [colors.primary],
  );

  const keyExtractor = useCallback((item: AccountLikeEnhanced) => item?.id, []);

  return (
    <SafeAreaView edges={["left", "right"]} isFlex>
      <TrackScreen category="AddAccounts" name="Success" currencyName={currency?.name} />
      <Flex alignItems={"center"} style={styles.root}>
        <View style={[styles.iconWrapper, { backgroundColor: rgba(colors.success, 0.1) }]}>
          <Circle size={24}>
            <Icons.CheckmarkCircleFill size="L" color={colors.success} />
          </Circle>
        </View>
        <LText semiBold style={styles.title}>
          {t("addAccounts.added", { count: fundedAccounts.length })}
        </LText>
      </Flex>
      <FlatList
        testID="receive-header-step2-accounts"
        data={fundedAccounts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        style={{ paddingHorizontal: 16 }}
      />

      <Flex mb={insets.bottom + 2} px={6} rowGap={6}>
        <Button size="large" type="shade" testID="button-create-account">
          {t("addAccounts.addAccountsSuccess.ctaAddFunds")}
        </Button>
        <Button size="large" testID="button-create-account">
          {t("addAccounts.addAccountsSuccess.ctaClose")}
        </Button>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  currencySuccess: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  outer: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 34,
    height: 34,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 26,
    height: 26,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 32,
    fontSize: 24,
  },
  desc: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
  },
  buttonsContainer: {
    alignSelf: "stretch",
  },
  button: {
    marginBottom: 16,
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
