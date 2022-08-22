import { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import {
  NavigationContainer,
  useNavigation,
  useTheme,
} from "@react-navigation/native";
import { View, StyleSheet, Linking } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import type { Account } from "@ledgerhq/types-live";
import StepHeader from "../../../components/StepHeader";
import { Alert, Flex, Text } from "@ledgerhq/native-ui";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import ConnectDevice from "../../../screens/ConnectDevice";
import SelectDevice from "../../../screens/SelectDevice";
import DelegationStarted from "./01-Started";
import Button from "../../../components/Button";
import { ScreenName, NavigatorName } from "../../../const";
import { useSelector } from "react-redux";
import { accountScreenSelector } from "../../../reducers/accounts";
import { useRoute } from "@react-navigation/native";
import { CeloAccount } from "@ledgerhq/live-common/lib/families/celo/types";

function CeloTestNav() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const navigation = useNavigation();

  const routeParams = useRoute().params;
  const { account } = useSelector(accountScreenSelector(routeParams));
  const { celoResources } = account as CeloAccount;

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: typeof NavigatorName | typeof ScreenName,
      screen?: typeof ScreenName,
      params?: { [key: string]: any },
    }) => {
      navigation.navigate(route, {
        screen,
        params: { ...params, accountId: account?.id },
      });
    },
    [navigation, account?.id],
  );

  const onAccountRegistration = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloRegistrationFlow,
      screen: ScreenName.CeloRegistrationStarted,
      params: {
        accountId: account?.id,
        // any other relevant param
      },
    });
  }, [onNavigate, account]);

  const onLock = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloLockFlow,
      screen: ScreenName.CeloLockAmount,
      params: {
        accountId: account?.id,
        // any other relevant param
      },
    });
  }, [onNavigate, account]);

  // const onUnlock = useCallback(() => {
  //   onNavigate({
  //     route: NavigatorName.CosmosDelegationFlow,
  //     screen: ScreenName.CosmosDelegationStarted,
  //     params: {},
  //   });

  // }, [onNavigate]);

  // const onActivate = useCallback(() => {
  //   onNavigate({
  //     route: NavigatorName.CosmosDelegationFlow,
  //     screen: ScreenName.CosmosDelegationStarted,
  //     params: {},
  //   });

  // }, [onNavigate]);

  // const onWithdraw = useCallback(() => {
  //   onNavigate({
  //     route: NavigatorName.CosmosDelegationFlow,
  //     screen: ScreenName.CosmosDelegationStarted,
  //     params: {},
  //   });

  // }, [onNavigate]);

  // const onVote = useCallback(() => {
  //   onNavigate({
  //     route: NavigatorName.CosmosDelegationFlow,
  //     screen: ScreenName.CosmosDelegationStarted,
  //     params: {},
  //   });

  // }, [onNavigate]);

  // const onRevoke = useCallback(() => {
  //   onNavigate({
  //     route: NavigatorName.CosmosDelegationFlow,
  //     screen: ScreenName.CosmosDelegationStarted,
  //     params: {},
  //   });

  // }, [onNavigate]);

  const isRegistered = account.celoResources?.registrationStatus;

  return (
    <View>
      <Text> TEST TEST TEST </Text>
      <Text> TEST TEST TEST </Text>
      {!isRegistered ? (
        <Button
          event="Celo Account Registration Click"
          onPress={onAccountRegistration}
          type="main"
          title={t("celo.simpleOperation.modes.register.title")}
        />
      ) : null}

      {isRegistered ? <Button
        event="Celo Lock Click"
        onPress={onLock}
        type="main"
        title={t("celo.manage.lock.title")}
      /> : null}
      <Button
        event="Celo Unlock Click"
        onPress={onLock}
        type="main"
        title={t("celo.manage.unlock.title")}
      />

      <Button
        event="Celo Withdraw Click"
        onPress={onLock}
        type="main"
        title={t("celo.manage.withdraw.title")}
      />
      <Button
        event="Celo Vote Click"
        onPress={onLock}
        type="main"
        title={t("celo.manage.activate.title")}
      />

      <Button
        event="Celo Revoke Click"
        onPress={onLock}
        type="main"
        title={t("celo.manage.revoke.title")}
      />
    </View>
  );
}

const options = {
  headerShown: false,
};

export { CeloTestNav as component, options };
