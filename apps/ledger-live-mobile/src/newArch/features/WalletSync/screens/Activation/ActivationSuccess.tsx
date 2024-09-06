import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import {
  BaseComposite,
  RootNavigationComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

import { NavigatorName, ScreenName } from "~/const";
import { useDispatch, useSelector } from "react-redux";
import { isFromLedgerSyncOnboardingSelector } from "~/reducers/settings";
import { useNavigation } from "@react-navigation/native";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { setFromLedgerSyncOnboarding } from "~/actions/settings";

type Props = BaseComposite<
  StackNavigatorProps<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncSuccess>
>;

export function ActivationSuccess({ navigation, route }: Props) {
  const { t } = useTranslation();
  const isFromLedgerSyncOnboarding = useSelector(isFromLedgerSyncOnboardingSelector);
  const { created } = route.params;
  const title = created ? "walletSync.success.activation" : "walletSync.success.sync";
  const desc = created ? "walletSync.success.activationDesc" : "walletSync.success.syncDesc";
  const dispatch = useDispatch();

  const navigationOnbarding =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  function syncAnother(): void {
    navigation.navigate(ScreenName.WalletSyncActivationProcess);
  }

  function close(): void {
    if (isFromLedgerSyncOnboarding) {
      dispatch(setFromLedgerSyncOnboarding(false));
      navigationOnbarding.navigate(NavigatorName.Base, {
        screen: NavigatorName.Main,
      });
    } else {
      navigation.navigate(NavigatorName.Settings, {
        screen: ScreenName.GeneralSettings,
      });
    }
  }

  return (
    <Success
      title={t(title)}
      desc={t(desc)}
      mainButton={{
        label: t("walletSync.success.syncAnother"),
        onPress: syncAnother,
      }}
      secondaryButton={{
        label: t("walletSync.success.close"),
        onPress: close,
      }}
    />
  );
}
