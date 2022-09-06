import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Flex, Icons, IconBoxList } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Video from "react-native-video";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { TrackScreen } from "../../../analytics";
import { completeOnboarding } from "../../../actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";
import { NavigatorName } from "../../../const";

import Button from "../../../components/wrappedUi/Button";
import StyledStatusBar from "../../../components/StyledStatusBar";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const source = require("../../../../assets/videos/onboarding.mp4");

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.constant.purple};
`;

const absoluteStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  top: 0,
  right: 0,
};

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

type Props = {
  navigation: any;
};

export default function OnboardingStepFinish({ navigation }: Props) {
  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();
  const { t } = useTranslation();
  const { colors } = useTheme();

  function onFinish(): void {
    dispatch(completeOnboarding());
    resetCurrentStep();

    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.popToTop();
    }

    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }

  return (
    <StyledSafeAreaView>
      <TrackScreen category="Onboarding" name="Finish" />
      <StyledStatusBar barStyle="light-content" />
      <Video
        source={source}
        style={absoluteStyle}
        muted
        repeat
        resizeMode={"cover"}
      />
      <Svg
        style={absoluteStyle}
        width="100%"
        height="120%"
        preserveAspectRatio="xMinYMin slice"
      >
        <Defs>
          <LinearGradient
            id="myGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop
              offset="10%"
              stopOpacity={0}
              stopColor={colors.constant.purple}
            />
            <Stop
              offset="60%"
              stopOpacity={1}
              stopColor={colors.constant.purple}
            />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
      <Flex flex={1} p={6}>
        <Flex flex={1} />
        <IconBoxList
          items={items.map(item => ({
            Icon: item.Icon,
            title: t(item.title),
            description: t(item.desc),
          }))}
        />
      </Flex>
      <Button
        m={6}
        type="main"
        outline={false}
        event="GetDeviceScreen - Buy Ledger"
        onPress={onFinish}
        size="large"
      >
        {t("onboarding.stepFinish.cta")}
      </Button>
    </StyledSafeAreaView>
  );
}
