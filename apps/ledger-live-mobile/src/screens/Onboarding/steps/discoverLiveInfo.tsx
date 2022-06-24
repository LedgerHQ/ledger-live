import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Flex,
  Carousel,
  Text,
  Button,
  StoriesIndicator,
  Box,
} from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled, { useTheme } from "styled-components/native";
import { useDispatch } from "react-redux";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Image, ImageProps } from "react-native";
import { completeOnboarding, setReadOnlyMode } from "../../../actions/settings";

import { NavigatorName } from "../../../const";

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

const Item = ({
  title,
  imageProps,
  displayNavigationButtons = false,
}: {
  title: string;
  imageProps: ImageProps;
  displayNavigationButtons?: boolean;
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const buyLedger = useCallback(() => {
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate(NavigatorName.BuyDevice);
  }, [navigation]);

  const exploreLedger = useCallback(() => {
    dispatch(completeOnboarding());
    dispatch(setReadOnlyMode(true));

    // Fixme: Navigate to read only page ?
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [dispatch, navigation]);

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
            <Stop
              offset="100%"
              stopOpacity={0}
              stopColor={colors.neutral.c00}
            />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
      <Text
        variant="h4"
        style={{ fontSize: 40, lineHeight: 40 }}
        mx={7}
        mt={3}
        mb={10}
      >
        {title}
      </Text>
      <Box
        flex={1}
        alignItems={"center"}
        justifyContent={"flex-end"}
        overflow={"hidden"}
      >
        <Image
          resizeMode={"cover"}
          style={{ flex: 1, width: "100%" }}
          {...imageProps}
        />
      </Box>
      {displayNavigationButtons && (
        <Box position={"absolute"} bottom={0} width={"100%"} px={6} pb={10}>
          <Button onPress={exploreLedger} type={"main"} mb={6} size="large">
            {t("onboarding.discoverLive.exploreWithoutADevice")}
          </Button>
          <Button
            onPress={buyLedger}
            type={"shade"}
            outline={true}
            size="large"
          >
            {t("onboarding.discoverLive.buyALedgerNow")}
          </Button>
        </Box>
      )}
    </Flex>
  );
};

function DiscoverLiveInfo() {
  const { t } = useTranslation();

  return (
    <StyledSafeAreaView>
      <Carousel
        autoDelay={6000}
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
      >
        {slidesImages.map((image, index) => (
          <Item
            key={index}
            title={t(`onboarding.discoverLive.${index}.title`)}
            imageProps={{
              source: image,
            }}
            displayNavigationButtons={slidesImages.length - 1 === index}
          />
        ))}
      </Carousel>
    </StyledSafeAreaView>
  );
}

export default DiscoverLiveInfo;
