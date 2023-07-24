import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Text, ScrollListContainer, Box, Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { props } from "lodash/fp";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import Touchable from "../../../components/Touchable";
import { TrackScreen, track } from "../../../analytics";
import { ScreenName } from "../../../const/navigation";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { setOnboardingType } from "../../../actions/settings";
import { OnboardingType } from "../../../reducers/types";
import OnboardingView from "./OnboardingView";
import { SelectionCards } from "./Cards/SelectionCard";

type CardProps = {
  title: string;
  event: string;
  eventProperties?: Record<string, unknown>;
  testID: string;
  onPress: React.ComponentProps<typeof Touchable>["onPress"];
  style?: React.CSSProperties;
  Icon?: React.ReactElement;
};

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
            icon: <IconsLegacy.BluetoothMedium color={colors.primary.c80} size={24} />,
          },
          {
            title: t("onboarding.welcomeBackStep.sync"),
            event: "button_clicked",
            eventProperties: {
              button: "Sync with Desktop",
            },
            testID: "Existing Wallet | Sync",
            onPress: sync,
            icon: <IconsLegacy.QrCodeMedium color={colors.primary.c80} size={24} />,
          },
        ]}
      />
    </OnboardingView>
  );
}

export default AccessExistingWallet;
