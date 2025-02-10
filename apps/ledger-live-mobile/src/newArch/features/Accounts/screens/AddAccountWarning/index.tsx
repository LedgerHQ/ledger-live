import React, { useCallback } from "react";
import { Flex, Icons, rgba, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import AccountItem from "../../components/AccountsListView/components/AccountItem";
import { Account } from "@ledgerhq/types-live";
import SafeAreaView from "~/components/SafeAreaView";
import Circle from "~/components/Circle";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import VerticalGradientBackground from "../../components/VerticalGradientBackground";
import BigNumber from "bignumber.js";
import { useNavigation } from "@react-navigation/core";
import useAnimatedStyle from "../ScanDeviceAccounts/components/ScanDeviceAccountsFooter/useAnimatedStyle";
import AddFundsButton from "../../components/AddFundsButton";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import { AddAccountContexts } from "../AddAccount/enums";
type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsWarning>
>;

export default function AddAccountsWarning({ route }: Props) {
  const { colors, space } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { animatedSelectableAccount } = useAnimatedStyle();

  const { emptyAccount, emptyAccountName, currency, context } = route.params || {};

  const statusColor = colors.warning.c70;

  const goToAccounts = useCallback(
    (accountId: string) => () => {
      if (context === AddAccountContexts.AddAccounts) {
        navigation.navigate(ScreenName.Account, {
          accountId,
        });
      } else {
        navigation.navigate(NavigatorName.ReceiveFunds, {
          screen: ScreenName.ReceiveConfirmation,
          params: {
            ...route.params,
            accountId,
          },
        });
      }
    },
    [navigation, route.params, context],
  );

  const handleOnCloseWarningScreen = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <VerticalGradientBackground stopColor={statusColor} />
      <Flex alignItems="center" pt={space[14]}>
        <Circle size={24} bg={rgba(statusColor, 0.05)} style={styles.iconWrapper}>
          <Icons.WarningFill size="L" color={statusColor} />
        </Circle>
        <Text style={styles.title}>
          {t("addAccounts.addAccountsWarning.cantCreateAccount.title", {
            accountName: emptyAccountName,
          })}
        </Text>
        <Text style={styles.desc} variant="bodyLineHeight" color="neutral.c70">
          {t("addAccounts.addAccountsWarning.cantCreateAccount.body", {
            accountName: emptyAccountName,
          })}
        </Text>
      </Flex>
      <Flex flex={1} px={space[6]} flexDirection="row" justifyContent="center">
        <Animated.View style={[{ width: "100%" }, animatedSelectableAccount]}>
          <TouchableOpacity onPress={goToAccounts(emptyAccount?.id as string)}>
            <Flex
              flexDirection="row"
              alignItems="center"
              borderRadius={space[4]}
              padding={space[6]}
              backgroundColor="opacityDefault.c05"
              width="100%"
            >
              <AccountItem
                account={emptyAccount as Account}
                balance={emptyAccount?.balance || BigNumber(0)}
              />
              <Icons.ChevronRight size="M" color={colors.primary.c100} />
            </Flex>
          </TouchableOpacity>
        </Animated.View>
      </Flex>
      <Flex px={6} rowGap={6}>
        <AddFundsButton
          accounts={[emptyAccount as Account]}
          currency={currency}
          sourceScreenName={ScreenName.AddAccountsWarning}
        />
        <CloseWithConfirmation
          showButton
          buttonText={t("addAccounts.addAccountsSuccess.ctaClose")}
          onClose={handleOnCloseWarningScreen}
        />
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 16,
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
