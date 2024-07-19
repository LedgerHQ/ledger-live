import { Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useTheme } from "styled-components/native";
import { setOnboardingType } from "~/actions/settings";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const/navigation";
import { OnboardingType } from "~/reducers/types";
import { SelectionCards } from "./Cards/SelectionCard";
import OnboardingView from "./OnboardingView";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { logDrawer } from "LLM/components/QueuedDrawer/utils/logDrawer";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList & BaseNavigatorStackParamList,
  ScreenName.OnboardingWelcomeBack
>;

function AccessExistingWallet() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const walletSyncFeatureFlag = useFeature("llmWalletSync");

  const isWalletSyncEnabled = walletSyncFeatureFlag?.enabled;
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const connect = useCallback(() => {
    dispatch(setOnboardingType(OnboardingType.connect));

    navigation.navigate(ScreenName.OnboardingPairNew, {
      deviceModelId: undefined,
      showSeedWarning: false,
    });
  }, [dispatch, navigation]);

  const sync = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingImportAccounts);
  }, [navigation]);

  const openDrawer = useCallback(() => {
    setIsDrawerVisible(true);
    logDrawer("Wallet Sync Welcome back", "open");
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerVisible(false);
    logDrawer("Wallet Sync Welcome back", "close");
  }, []);

  const reopenDrawer = useCallback(() => {
    setIsDrawerVisible(true);
    logDrawer("Wallet Sync Welcome back", "reopen");
  }, []);

  return (
    <OnboardingView
      title={t("onboarding.welcomeBackStep.title")}
      subTitle={t("onboarding.welcomeBackStep.subtitle")}
      analytics={{
        tracking: {
          category: "Onboarding",
          name: "Choose Access to Wallet",
        },
      }}
    >
      <SelectionCards
        cards={[
          {
            title: t("onboarding.welcomeBackStep.connect"),
            event: "button_clicked",
            eventProperties: {
              button: "Connect your Ledger",
            },
            testID: "Existing Wallet | Connect",
            onPress: connect,
            icon: <Icons.Bluetooth color={colors.primary.c80} />,
          },
          ...(isWalletSyncEnabled
            ? [
                {
                  title: t("onboarding.welcomeBackStep.walletSync"),
                  event: "button_clicked",
                  eventProperties: {
                    button: "Sync with WalletSync",
                  },
                  testID: "Existing Wallet | Wallet Sync",
                  onPress: openDrawer,
                  icon: <Icons.QrCode color={colors.primary.c80} />,
                },
              ]
            : [
                {
                  title: t("onboarding.welcomeBackStep.sync"),
                  event: "button_clicked",
                  eventProperties: {
                    button: "Sync with Desktop",
                  },
                  testID: "Existing Wallet | Sync",
                  onPress: sync,
                  icon: <Icons.QrCodeScanner color={colors.primary.c80} />,
                },
              ]),
        ]}
      />
      <ActivationDrawer
        isOpen={isDrawerVisible}
        handleClose={closeDrawer}
        reopenDrawer={reopenDrawer}
      />
    </OnboardingView>
  );
}

export default AccessExistingWallet;
