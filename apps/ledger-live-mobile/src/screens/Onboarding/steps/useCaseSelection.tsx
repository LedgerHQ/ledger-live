import React, { useMemo } from "react";
import { Platform, SectionList } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import Illustration from "../../../images/illustration/Illustration";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import DiscoverCard from "../../Discover/DiscoverCard";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";

// @TODO Replace
const images = {
  light: {
    pairNew: require("../../../images/illustration/Light/_ConnectYourNano.png"),
    setupNano: require("../../../images/illustration/Light/_NewNano.png"),
    restoreRecoveryPhrase: require("../../../images/illustration/Light/_RestoreRecoveryPhrase.png"),
    syncCrypto: require("../../../images/illustration/Light/_SyncCrypto.png"),
    protect: require("../../../images/illustration/Light/_000_PLACEHOLDER.png"),
  },
  dark: {
    pairNew: require("../../../images/illustration/Dark/_ConnectYourNano.png"),
    setupNano: require("../../../images/illustration/Dark/_NewNano.png"),
    restoreRecoveryPhrase: require("../../../images/illustration/Dark/_RestoreRecoveryPhrase.png"),
    syncCrypto: require("../../../images/illustration/Dark/_SyncCrypto.png"),
    protect: require("../../../images/illustration/Dark/_000_PLACEHOLDER.png"),
  },
};

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingUseCase
>;

const OnboardingStepUseCaseSelection = () => {
  const { t } = useTranslation();
  const route = useRoute<NavigationProps["route"]>();
  const navigation = useNavigation<NavigationProps["navigation"]>();

  const servicesConfig = useFeature("protectServicesMobile");

  const deviceModelId = route?.params?.deviceModelId;

  const useCases = useMemo(
    () =>
      Platform.OS === "ios" && deviceModelId !== "nanoX"
        ? [
            {
              title: t("onboarding.stepUseCase.recovery"),
              data: [
                {
                  onPress: () =>
                    navigation.navigate(ScreenName.OnboardingImportAccounts, {
                      deviceModelId: route.params.deviceModelId,
                    }),
                  Image: (
                    <Illustration
                      size={130}
                      darkSource={images.dark.syncCrypto}
                      lightSource={images.light.syncCrypto}
                    />
                  ),
                  title: t("onboarding.stepUseCase.desktopSync.subTitle"),
                  labelBadge: t("onboarding.stepUseCase.firstUse.label"),
                  event: "Onboarding - Setup Import Accounts",
                },
              ],
            },
          ]
        : [
            {
              title: t("onboarding.stepUseCase.firstUse.title"),
              data: [
                {
                  onPress: () =>
                    navigation.navigate(
                      ScreenName.OnboardingModalSetupNewDevice,
                      { deviceModelId: route.params.deviceModelId },
                    ),
                  Image: (
                    <Illustration
                      size={130}
                      darkSource={images.dark.setupNano}
                      lightSource={images.light.setupNano}
                    />
                  ),
                  title: t("onboarding.stepUseCase.firstUse.subTitle"),
                  labelBadge: t("onboarding.stepUseCase.firstUse.label"),
                  event: "Onboarding - Setup new",
                },
              ],
            },
            {
              title: t("onboarding.stepUseCase.devicePairing.title"),
              data: [
                {
                  onPress: () =>
                    navigation.navigate(ScreenName.OnboardingPairNew, {
                      deviceModelId: route.params.deviceModelId,
                      showSeedWarning: true,
                    }),
                  Image: (
                    <Illustration
                      size={130}
                      darkSource={images.dark.pairNew}
                      lightSource={images.light.pairNew}
                    />
                  ),
                  title: t("onboarding.stepUseCase.devicePairing.subTitle"),
                  event: "Onboarding - Connect",
                },
                {
                  onPress: () =>
                    navigation.navigate(ScreenName.OnboardingRecoveryPhrase, {
                      deviceModelId: route.params.deviceModelId,
                      showSeedWarning: true,
                    }),
                  Image: (
                    <Illustration
                      size={130}
                      darkSource={images.dark.restoreRecoveryPhrase}
                      lightSource={images.light.restoreRecoveryPhrase}
                    />
                  ),
                  labelBadge: t("onboarding.stepUseCase.firstUse.label"),
                  title: t("onboarding.stepUseCase.restoreDevice.subTitle"),
                  event: "Onboarding - Restore",
                },
                ...(servicesConfig?.enabled
                  ? [
                      {
                        disabled: deviceModelId !== "nanoX",
                        onPress: () => {
                          if (deviceModelId === "nanoX") {
                            navigation.navigate(ScreenName.OnboardingPairNew, {
                              deviceModelId: route.params.deviceModelId,
                              next: ScreenName.OnboardingProtectFlow,
                              isProtectFlow: true,
                            });
                          }
                        },
                        Image: (
                          <Illustration
                            size={130}
                            darkSource={images.dark.protect}
                            lightSource={images.light.protect}
                          />
                        ),
                        title: t("onboarding.stepUseCase.protect.subTitle"),
                        labelBadge:
                          deviceModelId === "nanoX"
                            ? t("onboarding.stepUseCase.protect.label")
                            : undefined,
                        event: "Onboarding - Restore Protect",
                      },
                    ]
                  : []),
              ],
            },
          ],
    [
      deviceModelId,
      navigation,
      route.params.deviceModelId,
      servicesConfig?.enabled,
      t,
    ],
  );

  return (
    <OnboardingView hasBackButton>
      <SectionList
        sections={useCases}
        renderSectionHeader={({ section }) => (
          <Text variant="h2" uppercase>
            {t(section.title)}
          </Text>
        )}
        renderItem={({ item }) => (
          <DiscoverCard
            cardProps={{ mx: 0 }}
            titleProps={{ variant: "body", fontSize: 16 }}
            {...item}
          />
        )}
        SectionSeparatorComponent={({ leadingItem }) => (
          <Flex mt={leadingItem ? "9" : "8"} />
        )}
        stickySectionHeadersEnabled={false}
      />
      <TrackScreen category="Onboarding" name="UseCase" />
    </OnboardingView>
  );
};

export default OnboardingStepUseCaseSelection;
