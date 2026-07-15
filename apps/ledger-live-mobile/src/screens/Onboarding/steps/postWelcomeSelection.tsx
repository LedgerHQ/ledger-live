import { Button, Icons } from "@ledgerhq/native-ui";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useDispatch } from "~/context/hooks";
import { useTheme } from "styled-components/native";
import { setOnboardingHasDevice } from "~/actions/settings";
import { track, updateIdentify } from "~/analytics";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { SelectionCards } from "./Cards/SelectionCard";
import OnboardingView from "./OnboardingView";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { DETOX_ENABLED } from "~/utils/constants";

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingPostWelcomeSelection
>;

function PostWelcomeSelection() {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();
  const userHasDevice = route.params?.userHasDevice ?? false;
  const currentNavigation = navigation.getParent()?.getParent()?.getState().routes[0].name;
  const isInOnboarding = currentNavigation === NavigatorName.BaseOnboarding;
  const localizedRebornUrl = useLocalizedUrl(urls.reborn);
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("mobile");

  const identifyUser = useCallback(
    (hasDevice: boolean | null) => {
      if (isInOnboarding) dispatch(setOnboardingHasDevice(hasDevice));
      updateIdentify();
    },
    [dispatch, isInOnboarding],
  );

  const openNoLedgerYet = useCallback(() => {
    identifyUser(null);
    track("button_clicked", {
      button: "I don’t have a Ledger yet",
    });
    // Detox: keep the discover-live read-only e2e path; production opens the Reborn URL
    if (DETOX_ENABLED) {
      navigation.navigate(ScreenName.OnboardingModalDiscoverLive);
      return;
    }
    Linking.openURL(localizedRebornUrl);
  }, [identifyUser, localizedRebornUrl, navigation]);

  useFocusEffect(
    useCallback(() => {
      identifyUser(null);
    }, [identifyUser]),
  );

  const setupLedger = () => {
    identifyUser(null);
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  };

  const accessExistingWallet = () => {
    identifyUser(null);
    navigation.navigate(ScreenName.OnboardingWelcomeBack);
  };

  return (
    <OnboardingView
      title={t("onboarding.postWelcomeStep.title")}
      analytics={{
        tracking: {
          category: "Onboarding",
          name: "Get Started",
        },
      }}
      footer={
        isWallet40Enabled && userHasDevice ? undefined : (
          <Button type="default" mb={10} onPress={openNoLedgerYet} testID="onboarding-noLedgerYet">
            {t("onboarding.postWelcomeStep.noLedgerYet")}
          </Button>
        )
      }
    >
      <SelectionCards
        cards={[
          {
            title: t("onboarding.postWelcomeStep.setupLedger.title"),
            text: t("onboarding.postWelcomeStep.setupLedger.subtitle"),
            event: "button_clicked",
            eventProperties: {
              button: "Setup your Ledger",
            },
            testID: `onboarding-setupLedger`,
            onPress: setupLedger,
            icon: <Icons.PlusCircle color={colors.primary.c80} size="M" />,
          },
          {
            title: t("onboarding.postWelcomeStep.accessWallet.title"),
            text: t("onboarding.postWelcomeStep.accessWallet.subtitle"),
            event: "button_clicked",
            eventProperties: {
              button: "Access an existing wallet",
            },
            testID: `onboarding-accessWallet`,
            onPress: accessExistingWallet,
            icon: <Icons.WalletInput color={colors.primary.c80} />,
          },
        ]}
      />
    </OnboardingView>
  );
}

export default PostWelcomeSelection;
