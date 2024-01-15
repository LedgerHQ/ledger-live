import { useNavigation, useRoute } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  availablePendingWithdrawals,
  hasActivatableVotes,
  hasRevokableVotes,
} from "@ledgerhq/live-common/families/celo/logic";
import { StackNavigationProp } from "@react-navigation/stack";
import { accountScreenSelector } from "~/reducers/accounts";
import { ScreenName, NavigatorName } from "~/const";
import Button from "~/components/Button";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, NavigatorName.CeloManageAssetsNavigator>
>;

function ManageAssetsNavigator() {
  const { t } = useTranslation();

  const navigation = useNavigation<NavigationProps["navigation"]>();
  navigation.setOptions({ title: t("celo.manage.title") });

  const route = useRoute<NavigationProps["route"]>();
  const { account } = useSelector(accountScreenSelector(route?.params));
  const { celoResources } = account as CeloAccount;
  const { votes } = celoResources;

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: string;
      screen?: string;
      params?: { [key: string]: unknown };
    }) => {
      // This is complicated (even impossible?) to type properly…
      (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(route, {
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
      },
    });
  }, [onNavigate, account]);

  const onLock = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloLockFlow,
      screen: ScreenName.CeloLockAmount,
      params: {
        accountId: account?.id,
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

  const onWithdraw = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloWithdrawFlow,
      screen: ScreenName.CeloWithdrawAmount,
      params: {},
    });
  }, [onNavigate]);

  const onVote = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloVoteFlow,
      screen: votes?.length === 0 ? ScreenName.CeloVoteStarted : ScreenName.CeloVoteSummary,
      params: {},
    });
  }, [onNavigate, votes?.length]);

  const onRevoke = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloRevokeFlow,
      screen: ScreenName.CeloRevokeSummary,
      params: {},
    });
  }, [onNavigate]);

  const isRegistered = (account as CeloAccount).celoResources?.registrationStatus;
  const unlockingEnabled = celoResources.nonvotingLockedBalance?.gt(0);
  const votingEnabled = celoResources.nonvotingLockedBalance?.gt(0);
  const activatingEnabled = hasActivatableVotes(account as CeloAccount);
  const revokingEnabled = hasRevokableVotes(account as CeloAccount);
  const withdrawEnabled = availablePendingWithdrawals(account as CeloAccount).length;

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "space-between", alignItems: "center" }}>
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
          onPress={onWithdraw}
          type="main"
          title={t("celo.manage.withdraw.title")}
          containerStyle={styles.button}
          disabled={!withdrawEnabled}
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
