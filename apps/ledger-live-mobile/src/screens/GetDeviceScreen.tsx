import React, { useCallback } from "react";
import {
  Flex,
  Icons,
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
import { useFeature } from "@ledgerhq/live-common/lib/featureFlags";
import { useSelector } from "react-redux";

import Button from "../components/wrappedUi/Button";
import { urls } from "../config/urls";
import { useNavigationInterceptor } from "./Onboarding/onboardingContext";
import { NavigatorName, ScreenName } from "../const";
import useIsAppInBackground from "../components/useIsAppInBackground";
import { hasCompletedOnboardingSelector } from "../reducers/settings";

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background.main};
`;

const sourceDark = require("../../assets/videos/NanoX_LL_Black.mp4");
const sourceLight = require("../../assets/videos/NanoX_LL_White.mp4");

const items = [
  {
    title: "buyDevice.0.title",
    desc: "buyDevice.0.desc",
    Icon: Icons.CrownMedium,
  },
  {
    title: "buyDevice.1.title",
    desc: "buyDevice.1.desc",
    Icon: Icons.LendMedium,
  },
  {
    title: "buyDevice.2.title",
    desc: "buyDevice.2.desc",
    Icon: Icons.ClaimRewardsMedium,
  },
  {
    title: "buyDevice.3.title",
    desc: "buyDevice.3.desc",
    Icon: Icons.NanoXAltMedium,
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

export default function GetDeviceScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const { setShowWelcome, setFirstTimeOnboarding } = useNavigationInterceptor();
  const buyDeviceFromLive = useFeature("buyDeviceFromLive");
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const setupDevice = useCallback(() => {
    setShowWelcome(false);
    setFirstTimeOnboarding(false);
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingDeviceSelection,
      },
    });
  }, [navigation, setFirstTimeOnboarding, setShowWelcome]);

  const buyLedger = useCallback(() => {
    if (buyDeviceFromLive?.enabled) {
      navigation.navigate(ScreenName.PurchaseDevice);
    } else {
      Linking.openURL(urls.buyNanoX);
    }
  }, [buyDeviceFromLive?.enabled]);

  const videoMounted = !useIsAppInBackground();

  return (
    <StyledSafeAreaView>
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
            <Icons.ArrowLeftMedium size="24px" />
          </TouchableOpacity>
        )}
        <Text variant="h3" lineHeight="18" uppercase>
          {t("buyDevice.title")}
        </Text>
        {hasCompletedOnboarding ? (
          <TouchableOpacity onPress={handleBack} hitSlop={hitSlop}>
            <Icons.CloseMedium size="24px" />
          </TouchableOpacity>
        ) : (
          <Flex width={24} />
        )}
      </Flex>
      <ScrollListContainer>
        <Flex
          height={240}
          my={-50}
          width="100%"
          position="relative"
          overflow="hidden"
        >
          {videoMounted && (
            <Video
              disableFocus
              source={theme === "light" ? sourceLight : sourceDark}
              style={{
                ...videoStyle,
                backgroundColor: colors.background.main,
                transform: [{ scale: 1.4 }],
              }}
              muted
              resizeMode={"cover"}
            />
          )}
          <Flex
            style={{
              ...videoStyle,
              opacity: 0.1,
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
          event="BuyDeviceScreen - Buy Ledger"
          onPress={buyLedger}
          size="large"
        >
          {t("buyDevice.cta")}
        </Button>
        <Flex px={6} pt={0} pb={5}>
          <TextLink
            type="color"
            onPress={setupDevice}
            Icon={Icons.ArrowRightMedium}
            iconPosition="right"
          >
            {t("buyDevice.footer")}
          </TextLink>
        </Flex>
      </Flex>
    </StyledSafeAreaView>
  );
}
