import React, { useCallback } from "react";
import { Button, Flex, Icons, rgba, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AccountItem from "../../components/AccountsListView/components/AccountItem";
import { Account } from "@ledgerhq/types-live";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SafeAreaView from "~/components/SafeAreaView";
import Circle from "~/components/Circle";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import VerticalGradientBackground from "../../components/VerticalGradientBackground";
import BigNumber from "bignumber.js";
import { useNavigation } from "@react-navigation/core";
import useAnimatedStyle from "../ScanDeviceAccounts/components/ScanDeviceAccountsFooter/useAnimatedStyle";
import AddFundsButton from "../../components/AddFundsButton";
type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsWarning>
>;

export default function AddAccountsWarning({ route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const { animatedSelectableAccount } = useAnimatedStyle();

  const goToAccounts = useCallback(
    (accountId: string) => () => {
      navigation.navigate(ScreenName.Account, {
        accountId,
      });
    },
    [navigation],
  );
  const { emptyAccount, emptyAccountName, currency } = route.params || {};

  const statusColor = colors.warning.c70;

  return (
    <SafeAreaView edges={["left", "right"]} isFlex>
      <VerticalGradientBackground stopColor={statusColor} />
      <Flex alignItems={"center"} flex={1} style={styles.root}>
        <View style={[styles.iconWrapper, { backgroundColor: rgba(statusColor, 0.1) }]}>
          <Circle size={24}>
            <Icons.WarningFill size="L" color={statusColor} />
          </Circle>
        </View>
        <>
          <Text style={styles.title}>
            {t("addAccounts.addAccountsWarning.cantCreateAccount.title", {
              accountName: emptyAccountName,
            })}
          </Text>

          <Text style={styles.desc}>
            {t("addAccounts.addAccountsWarning.cantCreateAccount.body", {
              accountName: emptyAccountName,
            })}
          </Text>
        </>
      </Flex>
      <Flex flex={1} p={6} flexDirection="row" justifyContent="center">
        <Animated.View style={[animatedSelectableAccount]}>
          <TouchableOpacity onPress={goToAccounts(emptyAccount?.id as string)}>
            <Flex
              flexDirection="row"
              alignItems="center"
              backgroundColor="neutral.c30"
              borderRadius="12px"
              padding="12px"
              width={343}
            >
              <AccountItem
                account={emptyAccount as Account}
                balance={emptyAccount?.spendableBalance as BigNumber}
              />
              <Icons.ChevronRight size="M" color={colors.primary.c100} />
            </Flex>
          </TouchableOpacity>
        </Animated.View>
      </Flex>
      <Flex mb={insets.bottom + 2} px={6} rowGap={6}>
        <AddFundsButton accounts={[emptyAccount as Account]} currency={currency} />
        <Button size="large" testID="button-create-account">
          {t("addAccounts.addAccountsSuccess.ctaClose")}
        </Button>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  title: {
    marginTop: 32,
    fontSize: 24,
    textAlign: "center",
    width: "100%",
    fontWeight: 600,
    fontStyle: "normal",
    lineHeight: 32.4,
    letterSpacing: 0.75,
  },
  desc: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
