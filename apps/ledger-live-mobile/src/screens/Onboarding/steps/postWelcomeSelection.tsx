import { Button, Icons } from "@ledgerhq/native-ui";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useTheme } from "styled-components/native";
import { setOnboardingHasDevice, setReadOnlyMode } from "~/actions/settings";
import { track, updateIdentify } from "~/analytics";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { SelectionCards } from "./Cards/SelectionCard";
import { NoLedgerYetModal } from "./NoLedgerYetModal";
import OnboardingView from "./OnboardingView";

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingPostWelcomeSelection
>;

function PostWelcomeSelection() {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const currentNavigation = navigation.getParent()?.getParent()?.getState().routes[0].name;
  const isInOnboarding = currentNavigation === NavigatorName.BaseOnboarding;

  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    identifyUser(null);
    setModalOpen(true);
    track("button_clicked", {
      button: "I don’t have a Ledger yet",
    });
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
        <Button type="default" mb={10} onPress={openModal} testID="onboarding-noLedgerYet">
          {t("onboarding.postWelcomeStep.noLedgerYet")}
        </Button>
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
