import React, { useCallback } from "react";
import { Image, ImageStyle, StyleProp, ViewStyle } from "react-native";
import { Flex, Text, IconsLegacy, Link } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Button, { WrappedButtonProps } from "./wrappedUi/Button";
import { NavigatorName, ScreenName } from "~/const";
import ForceTheme from "./theme/ForceTheme";

import buyImgSource from "~/images/illustration/Shared/_NanoXTop.png";
import setupImgSource from "~/images/illustration/Shared/_NanoXBoxTop.png";
import { track } from "~/analytics";
import { RootNavigationComposite, StackNavigatorNavigation } from "./RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "./RootNavigator/types/BaseNavigator";

type Props = {
  topLeft?: JSX.Element | null;
  buttonLabel?: string;
  buttonSize?: WrappedButtonProps["size"];
  event?: string;
  eventProperties?: Record<string, unknown>;
  style?: StyleProp<ViewStyle>;
  imageScale?: number;
  imageStyle?: StyleProp<ImageStyle>;
  variant?: "buy" | "setup";
  screen: string;
};

const Container = styled(Flex).attrs({
  backgroundColor: "primary.c80",
  padding: 16,
  flexDirection: "row",
  alignItems: "flex-start",
  borderRadius: 2,
})``;

/** Preset props for a big nano image */
export const IMAGE_PROPS_BIG_NANO = {
  imageScale: 1.5,
  imageStyle: {
    height: 176,
    right: -65,
  },
};

/** Preset props for a small nano image */
export const IMAGE_PROPS_SMALL_NANO = {
  imageScale: 1,
  imageStyle: {
    height: 140,
    right: -70,
    bottom: -30,
  },
};

/** Preset props for a small nano image */
export const IMAGE_PROPS_SMALL_NANO_BOX = {
  imageScale: 2.5,
  imageStyle: {
    height: 110,
    right: -160,
  },
};

export default function BuyDeviceBanner({
  topLeft,
  buttonLabel,
  buttonSize = "medium",
  event,
  eventProperties,
  style,
  imageStyle,
  variant,
  screen,
}: Props) {
  const { t } = useTranslation();
  const { navigate } =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const handleOnPress = useCallback(() => {
    navigate(NavigatorName.BuyDevice);
  }, [navigate]);

  const handleSetupCtaOnPress = useCallback(() => {
    navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingPostWelcomeSelection,
        params: {
          userHasDevice: true,
        },
      },
    });
  }, [navigate]);

  const onPress = useCallback(() => {
    if (variant === "setup") {
      handleSetupCtaOnPress();
    } else {
      handleOnPress();
      track("button_clicked", {
        button: "Discover the Nano",
        page: screen,
      });
    }
  }, [handleOnPress, handleSetupCtaOnPress, screen, variant]);

  const pressMessage = useCallback(() => {
    track("message_clicked", {
      message: "I already have a device, set it up",
      page: screen,
      currency: eventProperties?.currency,
    });
    handleSetupCtaOnPress();
  }, [screen, eventProperties?.currency, handleSetupCtaOnPress]);

  return (
    <>
      <Container style={style}>
        <Flex flexDirection="column" alignItems="flex-start">
          {topLeft || (
            <Flex flexDirection="column" width="80%">
              <Text variant="h5" fontWeight="semiBold" color="constant.black" mb={3}>
                {t("buyDevice.bannerTitle")}
              </Text>
              <Text variant="paragraph" fontWeight="medium" color="constant.black" mb="20px">
                {t("buyDevice.bannerSubtitle")}
              </Text>
            </Flex>
          )}
          <ForceTheme selectedPalette={"light"}>
            <Button
              onPress={onPress}
              size={buttonSize}
              event={variant === "setup" ? undefined : event}
              eventProperties={variant === "setup" ? undefined : eventProperties}
              type="main"
              flexShrink={0}
            >
              {buttonLabel ?? t("buyDevice.bannerButtonTitle")}
            </Button>
          </ForceTheme>
        </Flex>
        <Flex flex={1} />
        <Flex
          position="absolute"
          right={0}
          bottom={0}
          borderRadius={2}
          overflow="hidden"
          pointerEvents="none"
        >
          <Image
            resizeMode="contain"
            resizeMethod="resize"
            style={imageStyle}
            source={variant === "setup" ? setupImgSource : buyImgSource}
          />
        </Flex>
      </Container>
      {variant !== "setup" && (
        <Flex alignItems="center" justifyContent="center" mt={24} mx="auto">
          <Link
            type="color"
            Icon={IconsLegacy.ArrowRightMedium}
            iconPosition="right"
            onPress={pressMessage}
          >
            {t("buyDevice.setupCta")}
          </Link>
        </Flex>
      )}
    </>
  );
}
