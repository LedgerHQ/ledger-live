import React, { useCallback, useState } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Box, Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useTheme } from "styled-components/native";
import { TrackScreen, track } from "../../../analytics";
import { ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import Button from "../../../components/Button";
import QueuedDrawer from "../../../components/QueuedDrawer";
import { SelectionCard } from "./SelectionCard";

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingUseCase
>;

const OnboardingStepUseCaseSelection = () => {
  const { t } = useTranslation();
  const route = useRoute<NavigationProps["route"]>();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { colors } = useTheme();
  const [isProtectDrawerOpen, setIsProtectDrawerOpen] = useState(false);

  const servicesConfig = useFeature("protectServicesMobile");

  const deviceModelId = route?.params?.deviceModelId;
  const getProductName = (modelId: DeviceModelId) =>
    getDeviceModel(modelId)
      ?.productName.replace("Ledger", "")
      .trimStart() || modelId;

  const onCloseProtectDrawer = useCallback(() => {
    setIsProtectDrawerOpen(false);
  }, []);

  const onBuyNanoX = useCallback(() => {
    Linking.openURL("https://shop.ledger.com/pages/ledger-nano-x");
  }, []);

  const onDiscoverBenefits = useCallback(() => {
    Linking.openURL("http://ledger.com");
  }, []);

  const onPressNew = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingModalSetupNewDevice, {
      deviceModelId,
    });
    track("button_clicked", {
      button: "Setup as new",
      page: "Onboarding setup new options",
    });
  }, [deviceModelId, navigation]);

  const onPressRecoveryPhrase = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingRecoveryPhrase, {
      deviceModelId,
      showSeedWarning: true,
    });

    track("button_clicked", {
      button: "Restore from recovery phrase",
      page: "Onboarding setup new options",
    });
  }, [navigation, deviceModelId]);

  const onPressProtect = useCallback(() => {
    if (deviceModelId === "nanoX") {
      navigation.navigate(ScreenName.OnboardingPairNew, {
        deviceModelId,
        next: ScreenName.OnboardingProtectFlow,
        isProtectFlow: true,
      });
    } else {
      setIsProtectDrawerOpen(true);
    }

    track("button_clicked", {
      button: "Restore with ledger recover",
      page: "Onboarding setup new options",
      timestamp: Date.now(),
    });
  }, [deviceModelId, navigation]);

  return (
    <OnboardingView hasBackButton>
      <TrackScreen category="Onboarding" name={""} />
      <TrackScreen category="Onboarding" name="SelectDevice" />
      <Text variant="h4" fontWeight="semiBold" mb={7}>
        {t("onboarding.stepUseCase.firstUse.section", {
          model: getProductName(deviceModelId),
        })}
      </Text>

      <SelectionCard
        title={t("onboarding.stepUseCase.firstUse.title")}
        subTitle={t("onboarding.stepUseCase.firstUse.title")}
        event="banner_clicked"
        eventProperties={{
          banner: "Explore LL",
        }}
        testID={`Onboarding PostWelcome - Selection|ExploreLedger`}
        onPress={onPressNew}
        Icon={<Icons.PlusMedium color={colors.primary.c80} size={14} />}
      />

      <Text variant="paragraph" fontWeight="medium" my={6} color={colors.opacityDefault.c70}>
        {t("onboarding.stepUseCase.devicePairing.title")}
      </Text>

      <SelectionCard
        title={t("onboarding.stepUseCase.restoreDevice.title")}
        subTitle={t("onboarding.stepUseCase.restoreDevice.subTitle")}
        event="banner_clicked"
        eventProperties={{
          banner: "Explore LL",
        }}
        testID={`Onboarding PostWelcome - Selection|ExploreLedger`}
        onPress={onPressRecoveryPhrase}
        Icon={<Icons.ListMedium color={colors.primary.c80} size={14} />}
      />

      {servicesConfig?.enabled && (
        <Box mt={6}>
          <SelectionCard
            title={t("onboarding.stepUseCase.protect.title")}
            subTitle={t("onboarding.stepUseCase.protect.subTitle")}
            event="banner_clicked"
            eventProperties={{
              banner: "Explore LL",
            }}
            testID={`Onboarding PostWelcome - Selection|ExploreLedger`}
            onPress={onPressProtect}
            Icon={<Icons.ShieldMedium color={colors.primary.c80} size={14} />}
          />
        </Box>
      )}

      <TrackScreen category="Onboarding" name="UseCase" />

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
