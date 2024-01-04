import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useFeature, isRecoverDisplayed } from "@ledgerhq/live-config/featureFlags/index";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { useDispatch } from "react-redux";
import { useTheme } from "styled-components/native";
import { setOnboardingType } from "~/actions/settings";
import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { OnboardingType } from "~/reducers/types";
import { SelectionCards } from "./Cards/SelectionCard";
import OnboardingView from "./OnboardingView";

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingUseCase
>;

const OnboardingStepUseCaseSelection = () => {
  const { t } = useTranslation();
  const route = useRoute<NavigationProps["route"]>();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const [isProtectDrawerOpen, setIsProtectDrawerOpen] = useState(false);

  const servicesConfig = useFeature("protectServicesMobile");

  const deviceModelId = route?.params?.deviceModelId;
  const getProductName = (modelId: DeviceModelId) =>
    getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;

  const onCloseProtectDrawer = () => {
    setIsProtectDrawerOpen(false);
  };

  const onBuyNanoX = () => {
    Linking.openURL("https://shop.ledger.com/pages/ledger-nano-x");
  };

  const onDiscoverBenefits = () => {
    Linking.openURL("http://ledger.com");
  };

  const onPressNew = () => {
    dispatch(setOnboardingType(OnboardingType.setupNew));
    navigation.navigate(ScreenName.OnboardingModalSetupNewDevice, {
      deviceModelId,
    });
  };

  const onPressRecoveryPhrase = () => {
    dispatch(setOnboardingType(OnboardingType.restore));
    navigation.navigate(ScreenName.OnboardingRecoveryPhrase, {
      deviceModelId,
      showSeedWarning: true,
    });
  };

  const onPressProtect = () => {
    if (deviceModelId === "nanoX") {
      const deeplink = servicesConfig?.params?.deeplink;

      if (deeplink) {
        Linking.openURL(deeplink);
      } else {
        navigation.navigate(ScreenName.OnboardingPairNew, {
          deviceModelId,
          next: ScreenName.OnboardingProtectFlow,
          isProtectFlow: true,
        });
      }
    } else {
      setIsProtectDrawerOpen(true);
    }
  };

  return (
    <OnboardingView
      title={t("onboarding.stepUseCase.firstUse.section", {
        model: getProductName(deviceModelId),
      })}
      analytics={{
        tracking: {
          category: "Onboarding",
          name: "setup new options",
        },
      }}
    >
      <SelectionCards
        cards={[
          {
            title: t("onboarding.stepUseCase.firstUse.title"),
            text: t("onboarding.stepUseCase.firstUse.subTitle"),
            event: "button_clicked",
            eventProperties: {
              button: "Create a new wallet",
            },
            testID: `onboarding-useCase-newWallet`,
            onPress: onPressNew,
            icon: <Icons.PlusCircle color={colors.primary.c80} />,
          },
          {
            title: t("onboarding.stepUseCase.restoreDevice.title"),
            text: t("onboarding.stepUseCase.restoreDevice.subTitle"),
            event: "button_clicked",
            eventProperties: {
              button: "Restore with your secret phrase",
            },
            testID: `onboarding-useCase-recoveryPhrase`,
            onPress: onPressRecoveryPhrase,
            icon: <Icons.Note color={colors.primary.c80} />,
          },
          ...(isRecoverDisplayed(servicesConfig, deviceModelId)
            ? [
                {
                  title: t("onboarding.stepUseCase.protect.title"),
                  text: t("onboarding.stepUseCase.protect.subTitle"),
                  event: "button_clicked",
                  eventProperties: {
                    button: "Restore with ledger recover",
                  },
                  testID: `Onboarding UseCase - Selection|Ledger Recover`,
                  onPress: onPressProtect,
                  icon: <Icons.ShieldCheck color={colors.primary.c80} />,
                },
              ]
            : []),
        ]}
      />

      <QueuedDrawer isRequestingToBeOpened={isProtectDrawerOpen} onClose={onCloseProtectDrawer}>
        <Flex>
          <Text variant="h4" textAlign="center" mb={6}>
            {t("onboarding.stepUseCase.protect.drawer.title")}
          </Text>
          <Text variant="body" textAlign="center" color="neutral.c80" mb={8}>
            {t("onboarding.stepUseCase.protect.drawer.desc")}
          </Text>

          <Button
            type="main"
            outline={false}
            iconPosition="right"
            iconName="ExternalLink"
            onPress={onBuyNanoX}
            mb={6}
            event="button_clicked"
            eventProperties={{
              button: "Get a Ledger Nano X",
              drawer: "Protect is available only on Nano X",
            }}
          >
            {t("onboarding.stepUseCase.protect.drawer.buyNanoX")}
          </Button>
          <Button
            type="default"
            outline={false}
            iconPosition="right"
            iconName="ExternalLink"
            onPress={onDiscoverBenefits}
            event="link_clicked"
            eventProperties={{
              link: "Discover the benefits",
              drawer: "Protect is available only on Nano X",
            }}
          >
            {t("onboarding.stepUseCase.protect.drawer.discoverBenefits")}
          </Button>
        </Flex>
      </QueuedDrawer>
    </OnboardingView>
  );
};

export default OnboardingStepUseCaseSelection;
