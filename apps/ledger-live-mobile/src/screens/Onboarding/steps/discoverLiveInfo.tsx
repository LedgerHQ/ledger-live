import React, { useCallback, useState, useMemo, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Carousel, Text, Button, StoriesIndicator, Box } from "@ledgerhq/native-ui";
import { useNavigation, useFocusEffect, CompositeNavigationProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled, { useTheme } from "styled-components/native";
import { useDispatch } from "react-redux";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Image, ImageProps } from "react-native";
import { completeOnboarding, setReadOnlyMode } from "~/actions/settings";

import { NavigatorName, ScreenName } from "~/const";
import { screen, track } from "~/analytics";

import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { BaseOnboardingNavigatorParamList } from "~/components/RootNavigator/types/BaseOnboardingNavigator";
import Config from "react-native-config";

const slidesImages = [
  require("../../../../assets/images/onboarding/stories/slide1.png"),
  require("../../../../assets/images/onboarding/stories/slide2.png"),
  require("../../../../assets/images/onboarding/stories/slide3.png"),
  require("../../../../assets/images/onboarding/stories/slide4.png"),
];

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
`;

type NavigationProp = CompositeNavigationProp<
  StackNavigatorNavigation<OnboardingNavigatorParamList, ScreenName.OnboardingLanguage>,
  RootNavigationComposite<StackNavigatorNavigation<BaseOnboardingNavigatorParamList>>
>;

const Item = ({
  title,
  imageProps,
  displayNavigationButtons = false,
  currentIndex,
  testID,
}: {
  title: string;
  imageProps: ImageProps;
  displayNavigationButtons?: boolean;
  currentIndex?: number;
  testID?: string;
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const screenName = useMemo(() => `Reborn Story Step ${currentIndex}`, [currentIndex]);

  const onClick = useCallback(
    (value: string) => {
      track("button_clicked", {
        button: value,
        page: screenName,
      });
    },
    [screenName],
  );

  const buyLedger = useCallback(() => {
    onClick("Buy a Ledger");
    navigation.navigate(NavigatorName.BuyDevice, {
      screen: undefined,
    } as never);
  }, [navigation, onClick]);

  const exploreLedger = useCallback(() => {
    dispatch(completeOnboarding());
    dispatch(setReadOnlyMode(true));
    onClick("Explore without a device");

    navigation.reset({
      index: 0,
      routes: [{ name: NavigatorName.Base } as never],
    });
  }, [dispatch, navigation, onClick]);

  const pressExplore = useCallback(() => {
    exploreLedger();
    onClick("Explore without a device");
  }, [exploreLedger, onClick]);

  const pressBuy = useCallback(() => {
    buyLedger();
    onClick("Buy a Ledger");
  }, [buyLedger, onClick]);

  return (
    <Flex flex={1} backgroundColor={`background.main`}>
      <Svg width="100%" height={102} preserveAspectRatio="xMinYMin slice">
        <Defs>
          <LinearGradient
            id="myGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopOpacity={1} stopColor={colors.neutral.c00} />
            <Stop offset="100%" stopOpacity={0} stopColor={colors.neutral.c00} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
      <Text
        variant="h4"
        style={{ fontSize: 40, lineHeight: 45 }}
        mx={7}
        mt={3}
        mb={10}
        testID={testID}
      >
        {title}
      </Text>
      <Box flex={1} alignItems={"center"} justifyContent={"flex-end"} overflow={"hidden"}>
        <Image resizeMode={"cover"} style={{ flex: 1, width: "100%" }} {...imageProps} />
      </Box>
      {displayNavigationButtons && (
        <Box position={"absolute"} bottom={0} width={"100%"} px={6} pb={10}>
          <Button
            onPress={pressExplore}
            type={"main"}
            mb={6}
            testID="discoverLive-exploreWithoutADevice"
          >
            {t("onboarding.discoverLive.exploreWithoutADevice")}
          </Button>
          <Button onPress={pressBuy} type={"shade"} outline={true}>
            {t("onboarding.discoverLive.buyALedgerNow")}
          </Button>
        </Box>
      )}
    </Flex>
  );
};

function DiscoverLiveInfo() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(1);
  const { source, setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen && setScreen(`Reborn Story Step ${currentIndex}`);

      return () => {
        setSource(`Reborn Story Step ${currentIndex}`);
      };
    }, [setScreen, currentIndex, setSource]),
  );

  const onChange = useCallback(
    (index: number, skipped: boolean) => {
      setCurrentIndex(index + 1);
      screen("Onboarding", `Reborn Story Step ${index + 1}`, {
        skipped,
        flow: "Onboarding No Device",
        source,
      });
    },
    [source],
  );

  const autoChange = useCallback((index: number) => onChange(index, false), [onChange]);
  const manualChange = useCallback((index: number) => onChange(index, true), [onChange]);

  return (
    <StyledSafeAreaView>
      <Carousel
        autoDelay={Config.MOCK ? 0 : 6000}
        scrollOnSidePress={true}
        restartAfterEnd={false}
        IndicatorComponent={StoriesIndicator}
        slideIndicatorContainerProps={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          px: 7,
        }}
        scrollViewProps={{ scrollEnabled: false }}
        maxDurationOfTap={700}
        onAutoChange={autoChange}
        onManualChange={manualChange}
      >
        {slidesImages.map((image, index) => (
          <Item
            key={index}
            title={t(`onboarding.discoverLive.${index}.title`)}
            imageProps={{
              source: image,
            }}
            displayNavigationButtons={slidesImages.length - 1 === index}
            currentIndex={currentIndex}
            testID={`onboarding-discoverLive-${index}-title`}
          />
        ))}
      </Carousel>
    </StyledSafeAreaView>
  );
}

export default DiscoverLiveInfo;
