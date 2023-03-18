import React, { useCallback, useMemo, useState } from "react";
import { Linking, Platform, SectionList } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import Illustration from "../../../images/illustration/Illustration";
import { TrackScreen, track } from "../../../analytics";
import { ScreenName } from "../../../const";
import OnboardingView from "../OnboardingView";
import DiscoverCard from "../../Discover/DiscoverCard";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import Button from "../../../components/Button";
import QueuedDrawer from "../../../components/QueuedDrawer";

// @TODO Replace
const images = {
  light: {
    pairNew: require("../../../images/illustration/Light/_ConnectYourNano.png"),
    setupNano: require("../../../images/illustration/Light/_NewNano.png"),
    restoreRecoveryPhrase: require("../../../images/illustration/Light/_RestoreRecoveryPhrase.png"),
    syncCrypto: require("../../../images/illustration/Light/_SyncCrypto.png"),
    protect: require("../../../images/illustration/Light/_LedgerRecover.png"),
  },
  dark: {
    pairNew: require("../../../images/illustration/Dark/_ConnectYourNano.png"),
    setupNano: require("../../../images/illustration/Dark/_NewNano.png"),
    restoreRecoveryPhrase: require("../../../images/illustration/Dark/_RestoreRecoveryPhrase.png"),
    syncCrypto: require("../../../images/illustration/Dark/_SyncCrypto.png"),
    protect: require("../../../images/illustration/Dark/_LedgerRecover.png"),
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

  const [isProtectDrawerOpen, setIsProtectDrawerOpen] = useState(false);

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
                        onPress: () => {
                          if (deviceModelId === "nanoX") {
                            navigation.navigate(ScreenName.OnboardingPairNew, {
                              deviceModelId: route.params.deviceModelId,
                              next: ScreenName.OnboardingProtectFlow,
                              isProtectFlow: true,
                            });
                          } else {
                            setIsProtectDrawerOpen(true);
                          }

                          track("button_clicked", {
                            button: "Restore with Protect",
                            screen: "UseCase",
                            timestamp: Date.now(),
                          });
                        },
                        Image: (
                          <Illustration
                            size={130}
                            darkSource={images.dark.protect}
                            lightSource={images.light.protect}
                          />
                        ),
                        title: t("onboarding.stepUseCase.protect.subTitle"),
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

  const onCloseProtectDrawer = useCallback(() => {
    setIsProtectDrawerOpen(false);
  }, []);

  const onBuyNanoX = useCallback(() => {
    Linking.openURL("https://shop.ledger.com/pages/ledger-nano-x");
  }, []);

  const onDiscoverBenefits = useCallback(() => {
    Linking.openURL("http://ledger.com");
  }, []);

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

      <QueuedDrawer
        isRequestingToBeOpened={isProtectDrawerOpen}
        onClose={onCloseProtectDrawer}
      >
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
