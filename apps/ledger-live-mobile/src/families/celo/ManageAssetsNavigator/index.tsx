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
import Button from "../../../components/Button";
import { ScreenName, NavigatorName } from "../../../const";
import { useSelector } from "react-redux";
import { accountScreenSelector } from "../../../reducers/accounts";
import { useRoute } from "@react-navigation/native";
import { CeloAccount } from "@ledgerhq/live-common/lib/families/celo/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { activatableVotes, hasActivatableVotes, hasRevokableVotes, revokableVotes } from "@ledgerhq/live-common/families/celo/logic";

function ManageAssetsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const navigation = useNavigation();
  navigation.setOptions({ title: t("celo.manage.title") });

  const routeParams = useRoute().params;
  const { account } = useSelector(accountScreenSelector(routeParams));
  const { celoResources } = account as CeloAccount;
  const { votes } = celoResources;

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: typeof NavigatorName | typeof ScreenName;
      screen?: typeof ScreenName;
      params?: { [key: string]: any };
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

  const onUnlock = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloUnlockFlow,
      screen: ScreenName.CeloUnlockAmount,
    });
  }, [onNavigate]);

  const onActivate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloActivateFlow,
      screen: ScreenName.CeloActivateSummary,
      params: {},
    });
  }, [onNavigate]);

  // const onWithdraw = useCallback(() => {
  //   onNavigate({
  //     route: NavigatorName.CosmosDelegationFlow,
  //     screen: ScreenName.CosmosDelegationStarted,
  //     params: {},
  //   });

  // }, [onNavigate]);

  const onVote = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloVoteFlow,
      screen: votes?.length === 0 ? ScreenName.CeloVoteStarted : ScreenName.CeloVoteSummary,
      params: {},
    });
  }, [onNavigate]);

  const onRevoke = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloRevokeFlow,
      screen: ScreenName.CeloRevokeSummary,
      params: {},
    });

  }, [onNavigate]);

  const isRegistered = (account as CeloAccount).celoResources
    ?.registrationStatus;
  const unlockingEnabled = celoResources.nonvotingLockedBalance?.gt(0);
  const votingEnabled = celoResources.nonvotingLockedBalance?.gt(0);
  const activatingEnabled = hasActivatableVotes(account as CeloAccount);
  const revokingEnabled = hasRevokableVotes(account as CeloAccount);

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "space-between", alignItems: "center" }}
    >
      <View>
        {!isRegistered ? (
          <Button
            event="Celo Account Registration Click"
            onPress={onAccountRegistration}
            type="main"
            title={t("celo.register.stepperHeader.title")}
            containerStyle={styles.button}
          />
        ) : null}

        {isRegistered ? (
          <Button
            event="Celo Lock Click"
            onPress={onLock}
            type="main"
            title={t("celo.manage.lock.title")}
            containerStyle={styles.button}
          />
        ) : null}
        <Button
          event="Celo Unlock Click"
          onPress={onUnlock}
          type="main"
          title={t("celo.manage.unlock.title")}
          containerStyle={styles.button}
          disabled={!unlockingEnabled}
        />
        <Button
          event="Celo Withdraw Click"
          onPress={onLock}
          type="main"
          title={t("celo.manage.withdraw.title")}
          containerStyle={styles.button}
          disabled={true}
        />
        <Button
          event="Celo Vote Click"
          onPress={onVote}
          type="main"
          title={t("celo.manage.vote.title")}
          containerStyle={styles.button}
          disabled={!votingEnabled}
        />

        <Button
          event="Celo Activate Click"
          onPress={onActivate}
          type="main"
          title={t("celo.manage.activate.title")}
          containerStyle={styles.button}
          disabled={!activatingEnabled}
        />

        <Button
          event="Celo Revoke Click"
          onPress={onRevoke}
          type="main"
          title={t("celo.manage.revoke.title")}
          containerStyle={styles.button}
          disabled={!revokingEnabled}
        />
      </View>
    </SafeAreaView>
  );
}

const options = {
  headerShown: true,
};

const styles = StyleSheet.create({
  button: {
    marginTop: 10,
    width: 240,
  },
});

export { ManageAssetsNavigator as component, options };
