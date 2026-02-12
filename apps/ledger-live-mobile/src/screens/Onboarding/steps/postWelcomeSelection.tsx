import { Button, Icons } from "@ledgerhq/native-ui";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Linking } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useDispatch } from "~/context/hooks";
import { useTheme } from "styled-components/native";
import { setOnboardingHasDevice, setReadOnlyMode } from "~/actions/settings";
import { track, updateIdentify } from "~/analytics";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { SelectionCards } from "./Cards/SelectionCard";
import { NoLedgerYetModal } from "./NoLedgerYetModal";
import OnboardingView from "./OnboardingView";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

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
  const llmRebornABtest = useFeature("llmRebornABtest");
  const localizedRebornUrl = useLocalizedUrl(urls.reborn);
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("mobile");

  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    identifyUser(null);
    track("button_clicked", {
      button: "I don’t have a Ledger yet",
    });
    if (llmRebornABtest?.enabled) {
      Linking.openURL(localizedRebornUrl);
    } else {
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const identifyUser = useCallback(
    (hasDevice: boolean | null) => {
      if (isInOnboarding) dispatch(setOnboardingHasDevice(hasDevice));
      updateIdentify();
    },
    [dispatch, isInOnboarding],
  );

  useFocusEffect(() => {
    if (!modalOpen) {
      identifyUser(null);
      dispatch(setReadOnlyMode(true));
    }
  });

  const setupLedger = () => {
    dispatch(setReadOnlyMode(false));
    identifyUser(null);
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  };

  const accessExistingWallet = () => {
    dispatch(setReadOnlyMode(false));
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
          <Button type="default" mb={10} onPress={openModal} testID="onboarding-noLedgerYet">
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

      <NoLedgerYetModal isOpen={modalOpen} onClose={closeModal} />
    </OnboardingView>
  );
}

export default PostWelcomeSelection;
