import { useCallback } from "react";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ImageSourcePropType, ImageStyle, StyleProp } from "react-native";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { WrappedButtonProps } from "~/components/wrappedUi/Button";
import { Props as ThemeProps } from "~/components/theme/ForceTheme";

import buyFlexSource from "~/images/illustration/Shared/_FlexTop.png";
import buyDoubleFlexSource from "~/images/illustration/Shared/_FlexTwoSides.png";
import setupYourLedger from "~/images/illustration/Shared/_LedgerSetup.png";

type Variant = "buy" | "setup";

type Image = "buyFlex" | "buyDoubleFlex" | "setupYourLedger";

export type Props = {
  image?: Image;
  variant?: Variant;
  screen: string;
  eventProperties?: Record<string, unknown>;
  topLeft?: JSX.Element | null;
  buttonLabel?: string;
  buttonSize?: WrappedButtonProps["size"];
  event?: string;
  imageScale?: number;
  imageStyle?: StyleProp<ImageStyle>;
};
const useBuyDeviceBannerModel = ({
  image,
  variant,
  screen,
  eventProperties,
  topLeft,
  buttonLabel,
  buttonSize = "medium",
  event,
  imageStyle,
}: Props) => {
  const { colors, theme } = useTheme();
  const { navigate } =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();

  const revertTheme: ThemeProps["selectedPalette"] = theme === "light" ? "dark" : "light";

  const imageSource: ImageSourcePropType = (() => {
    switch (image) {
      case "buyFlex":
        return buyFlexSource;
      case "buyDoubleFlex":
        return buyDoubleFlexSource;
      case "setupYourLedger":
        return setupYourLedger;
      default:
        return buyDoubleFlexSource;
    }
  })();

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

  return {
    revertTheme,
    colors,
    imageSource,
    variant,
    topLeft,
    buttonLabel,
    buttonSize,
    event,
    imageStyle,
    eventProperties,
    onPress,
    pressMessage,
  };
};

export default useBuyDeviceBannerModel;
