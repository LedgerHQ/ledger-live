import { Button, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
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
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { LandingPageUseCase } from "~/dynamicContent/types";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { filterCategoriesByLocation, formatCategories } from "~/dynamicContent/utils";
import { useDynamicContentLogic } from "~/dynamicContent/useDynamicContentLogic";

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingPostWelcomeSelection
>;

function PostWelcomeSelection() {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const rebornFeatureFlag = useFeature("llmRebornLP");
  const isRebornActive = rebornFeatureFlag?.enabled;
  const variant = isRebornActive && rebornFeatureFlag.params?.variant;
  const { categoriesCards, mobileCards } = useDynamicContent();
  const { fetchData, refreshDynamicContent } = useDynamicContentLogic();
  const [hasContentCardsToDisplayOnLp, setHasContentCardsToDisplayOnLp] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState(false);

  const onPressNoLedger = async () => {
    refreshDynamicContent();
    await fetchData();
    const categoriesToDisplay = filterCategoriesByLocation(
      categoriesCards,
      LandingPageUseCase.LP_Reborn1,
    );
    const categoriesFormatted = formatCategories(categoriesToDisplay, mobileCards);
    const hasContentCardsToDisplay = categoriesFormatted.length > 0;
    setHasContentCardsToDisplayOnLp(hasContentCardsToDisplay);

    if (hasContentCardsToDisplayOnLp && variant === ABTestingVariants.variantB) {
      navigation.navigate(NavigatorName.LandingPages, {
        screen: ScreenName.GenericLandingPage,
        params: {
          useCase: LandingPageUseCase.LP_Reborn1,
        },
      });
    } else setModalOpen(true);

    track("button_clicked", {
      button: "I don’t have a Ledger yet",
    });
  };

  const closeModal = () => setModalOpen(false);

  const identifyUser = (hasDevice: boolean) => {
    dispatch(setOnboardingHasDevice(hasDevice));
    updateIdentify();
  };

  const setupLedger = () => {
    dispatch(setReadOnlyMode(false));
    identifyUser(true);
    navigation.navigate(ScreenName.OnboardingDeviceSelection);
  };

  const accessExistingWallet = () => {
    dispatch(setReadOnlyMode(false));
    identifyUser(true);
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
        <Button type="default" mb={10} onPress={onPressNoLedger} testID="onboarding-noLedgerYet">
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
