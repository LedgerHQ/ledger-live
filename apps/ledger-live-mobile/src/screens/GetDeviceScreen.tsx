import React, { useCallback } from "react";
import {
  Flex,
  IconsLegacy,
  Text,
  IconBoxList,
  Link as TextLink,
  ScrollListContainer,
} from "@ledgerhq/native-ui";
import Video from "react-native-video";
import styled, { useTheme } from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Linking, TouchableOpacity } from "react-native";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { useSelector } from "react-redux";

import Button from "~/components/wrappedUi/Button";
import { urls } from "~/utils/urls";
import { useNavigationInterceptor } from "./Onboarding/onboardingContext";
import { NavigatorName, ScreenName } from "~/const";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { hasCompletedOnboardingSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import { track, TrackScreen } from "~/analytics";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BuyDeviceNavigatorParamList } from "~/components/RootNavigator/types/BuyDeviceNavigator";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import videoSources from "../../assets/videos";

const sourceDark = videoSources.nanoXDark;
const sourceLight = videoSources.nanoXLight;

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
`;

const items = [
  {
    title: "buyDevice.0.title",
    desc: "buyDevice.0.desc",
    Icon: IconsLegacy.CrownMedium,
  },
  {
    title: "buyDevice.1.title",
    desc: "buyDevice.1.desc",
    Icon: IconsLegacy.LendMedium,
  },
  {
    title: "buyDevice.2.title",
    desc: "buyDevice.2.desc",
    Icon: IconsLegacy.ClaimRewardsMedium,
  },
  {
    title: "buyDevice.3.title",
    desc: "buyDevice.3.desc",
    Icon: IconsLegacy.NanoXAltMedium,
  },
];

const videoStyle = {
  height: "100%",
  width: "100%",
  position: "absolute",
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
};

type NavigationProp = BaseNavigationComposite<
  | StackNavigatorNavigation<BuyDeviceNavigatorParamList, ScreenName.GetDevice>
  | StackNavigatorNavigation<OnboardingNavigatorParamList, ScreenName.GetDevice>
>;

export default function GetDeviceScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { theme, colors } = useTheme();
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const handleBack = useCallback(() => {
    navigation.goBack();
    if (readOnlyModeEnabled) {
      track("button_clicked", {
        button: "close",
        page: "Upsell Nano",
      });
    }
  }, [readOnlyModeEnabled, navigation]);

  const setupDevice = useCallback(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });
    if (readOnlyModeEnabled) {
      track("message_clicked", {
        message: "I already have a device, set it up now",
        page: "Upsell Nano",
      });
    }
  }, [readOnlyModeEnabled, navigation, setFirstTimeOnboarding, setShowWelcome]);

  const buyLedger = useCallback(() => {
    if (buyDeviceFromLive?.enabled) {
      // FIXME: ScreenName.PurchaseDevice does not exist when coming from the Onboarding navigator
      // @ts-expect-error This seem very impossible to type because ts is right…
      navigation.navigate(ScreenName.PurchaseDevice);
    } else {
      Linking.openURL(urls.buyNanoX);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyDeviceFromLive?.enabled]);

  const videoMounted = !useIsAppInBackground();

  return (
    <StyledSafeAreaView>
      {readOnlyModeEnabled ? <TrackScreen category="ReadOnly" name="Upsell Nano" /> : null}
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        background={colors.background.main}
        zIndex={1}
        p={6}
      >
        {hasCompletedOnboarding ? (
          <Flex width={24} />
        ) : (
          <TouchableOpacity onPress={handleBack} hitSlop={hitSlop}>
            <IconsLegacy.ArrowLeftMedium size="24px" />
          </TouchableOpacity>
        )}
        <Text variant="h3" lineHeight="20px" uppercase>
          {t("buyDevice.title")}
        </Text>
        {hasCompletedOnboarding ? (
          <TouchableOpacity onPress={handleBack} hitSlop={hitSlop}>
            <IconsLegacy.CloseMedium size="24px" />
          </TouchableOpacity>
        ) : (
          <Flex width={24} />
        )}
      </Flex>
      <ScrollListContainer>
        <Flex height={240} my={-50} width="100%" position="relative" overflow="hidden">
          {videoMounted && (
            <Video
              disableFocus
              source={theme === "light" ? sourceLight : sourceDark}
              style={{
                backgroundColor: colors.background.main,
                transform: [{ scale: 1.4 }],
                ...(videoStyle as object),
              }}
              muted
              resizeMode={"cover"}
            />
          )}
          <Flex
            style={{
              opacity: 0.1,
              ...(videoStyle as object),
            }}
            bg="background.main"
          />
        </Flex>
        <Flex p={6} pt={6}>
          <Flex mt={0} mb={8} justifyContent="center" alignItems="stretch">
            <Text px={6} textAlign="center" variant="large">
              {t("buyDevice.desc")}
            </Text>
          </Flex>
          <IconBoxList
            iconVariants="plain"
            iconShapes="circle"
            items={items.map(item => ({
              ...item,
              title: t(item.title),
              description: t(item.desc),
            }))}
          />
        </Flex>
      </ScrollListContainer>
      <Flex borderTopColor="neutral.c40" borderTopWidth={1}>
        <Button
          mx={6}
          my={6}
          type="main"
          outline={false}
          event="button_clicked"
          testID="getDevice-buy-button"
          eventProperties={{
            button: "Buy your Ledger now",
            page: ScreenName.GetDevice,
          }}
          onPress={buyLedger}
          size="large"
        >
          {t("buyDevice.cta")}
        </Button>
        <Flex px={6} pt={0} pb={5}>
          <TextLink
            type="color"
            onPress={setupDevice}
            Icon={IconsLegacy.ArrowRightMedium}
            iconPosition="right"
          >
            {t("buyDevice.footer")}
          </TextLink>
        </Flex>
      </Flex>
    </StyledSafeAreaView>
  );
}
