import { Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
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

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList & BaseNavigatorStackParamList,
  ScreenName.OnboardingWelcomeBack
>;

function AccessExistingWallet() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProps["navigation"]>();

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
        ]}
      />
    </OnboardingView>
  );
}

export default AccessExistingWallet;
