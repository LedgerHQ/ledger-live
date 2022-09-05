import React, { useCallback, useMemo } from "react";
import { Platform, SectionList } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import Illustration from "../../../images/illustration/Illustration";
import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import DiscoverCard from "../../Discover/DiscoverCard";

// @TODO Replace
const images = {
  light: {
    pairNew: require("../../../images/illustration/Light/_ConnectYourNano.png"),
    setupNano: require("../../../images/illustration/Light/_NewNano.png"),
    restoreRecoveryPhrase: require("../../../images/illustration/Light/_RestoreRecoveryPhrase.png"),
  },
  dark: {
    pairNew: require("../../../images/illustration/Dark/_ConnectYourNano.png"),
    setupNano: require("../../../images/illustration/Dark/_NewNano.png"),
    restoreRecoveryPhrase: require("../../../images/illustration/Dark/_RestoreRecoveryPhrase.png"),
  },
};

type CurrentRouteType = RouteProp<
  { params: { deviceModelId: string } },
  "params"
>;

const OnboardingStepUseCaseSelection = () => {
  const { t } = useTranslation();
  const route = useRoute<CurrentRouteType>();
  const navigation = useNavigation();

  const deviceModelId = route?.params?.deviceModelId;

  const navigateTo = useCallback(
    (screen: string, params?: any) => {
      navigation.navigate(screen, {
        ...route.params,
        ...params,
      });
    },
    [navigation, route.params],
  );

  const useCases = useMemo(
    () =>
      Platform.OS === "ios" && deviceModelId !== "nanoX"
        ? [
            {
              title: t("onboarding.stepUseCase.recovery"),
              data: [
                {
                  onPress: () =>
                    navigateTo(ScreenName.OnboardingImportAccounts, {
                      showRecoveryWarning: true,
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
                    navigateTo(ScreenName.OnboardingModalSetupNewDevice),
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
                    navigateTo(ScreenName.OnboardingPairNew, {
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
                    navigateTo(ScreenName.OnboardingRecoveryPhrase, {
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
              ],
            },
          ],
    [deviceModelId, navigateTo, t],
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
