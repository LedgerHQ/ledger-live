import React, { useCallback, useEffect, useContext, useState } from "react";
import { BackHandler, Dimensions, Pressable } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import Lottie from "lottie-react-native";
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useExperimental } from "../../experimental";
import Config from "react-native-config";
import { HEIGHT as ExperimentalHeaderHeight } from "~/screens/Settings/Experimental/ExperimentalHeader";
import proxyStyled, { BaseStyledProps } from "@ledgerhq/native-ui/components/styled";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styled, { useTheme } from "styled-components/native";
import { useSelector } from "~/context/hooks";
import Touchable from "../Touchable";
import TransferDrawer from "./TransferDrawer";
import { lockSubject } from "../RootNavigator/CustomBlockRouterNavigator";
import { MAIN_BUTTON_BOTTOM, MAIN_BUTTON_SIZE } from "./shared";
import { useTrack } from "~/analytics";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";

import lightAnimSource from "~/animations/mainButton/light.json";
import darkAnimSource from "~/animations/mainButton/dark.json";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";

const MainButton = proxyStyled(Touchable).attrs<BaseStyledProps>(p => ({
  backgroundColor: p.theme.colors.primary.c80,
  hitSlop: 0,
  height: MAIN_BUTTON_SIZE,
  width: MAIN_BUTTON_SIZE,
  borderRadius: MAIN_BUTTON_SIZE / 2,
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
}))``;

export default () => null;

const AnimatedDrawerContainer = Animated.createAnimatedComponent(
  styled(Flex).attrs<BaseStyledProps>(p => ({
    position: "absolute",
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    backgroundColor: p.theme.colors.background.main,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
  }))``,
);

const BackdropPressable = Animated.createAnimatedComponent(styled(Pressable)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.7);
`);

const DURATION_MS = Config.DETOX ? 50 : 400;
const Y_AMPLITUDE = 90;

const animParams = { duration: DURATION_MS };

/** Just for debugging */
const initialIsModalOpened = false;

export function TransferTabIcon() {
  const {
    colors: { type: themeType },
  } = useTheme();
  const isExperimental = useExperimental();
  const track = useTrack();

  // Value used to derive which step of animation is being displayed.
  // Used by several animation: drawer translation and opacity, button's lottie etc.
  const openAnimValue = useSharedValue(initialIsModalOpened ? 1 : 0);

  const getIsModalOpened = useCallback(() => openAnimValue.value === 1, [openAnimValue]);

  const backdropProps = useAnimatedProps(() => ({
    pointerEvents: openAnimValue.value === 1 ? ("auto" as const) : ("box-none" as const),
  }));

  const drawerContainerProps = useAnimatedProps(() => ({
    pointerEvents: openAnimValue.value === 1 ? ("auto" as const) : ("none" as const),
  }));

  const translateYStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: interpolate(openAnimValue.value, [0, 1, 2], [Y_AMPLITUDE, 0, Y_AMPLITUDE]),
        },
      ],
    }),
    [openAnimValue],
  );

  const opacityStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(openAnimValue.value, [0, 1, 2], [0, 1, 0]),
    }),
    [openAnimValue],
  );

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const [isOpened, setIsOpened] = useState(false);
  const [lottieProgress, setLottieProgress] = useState(0);

  /**
   * openAnimValue.value:
   *            0             ->       1           ->             2
   * transfer arrow icon (0)     close icon (0.5)        transfer arrow icon (1)
   * with intermediate animation/steps in decimal (test 0.2 for ex)
   *
   * progress: from lottie-react-native. Represents the normalized progress of the animation.
   * If this prop is updated, the animation will correspondingly update to the frame at that progress value.
   * Uses animatedReaction to update Lottie progress imperatively for better performance (in response to newArch)
   */
  useAnimatedReaction(
    () => interpolate(openAnimValue.value, [0, 1, 2], [0, 0.5, 1]),
    progress => {
      scheduleOnRN(setLottieProgress, progress);
    },
  );

  const openModal = useCallback(() => {
    setIsOpened(true);
    const animCallback = () => {
      if (!readOnlyModeEnabled) track("drawer_viewed", { drawer: "trade" });
    };

    openAnimValue.value = 0;
    openAnimValue.value = withTiming(1, animParams, finished => {
      if (finished) {
        scheduleOnRN(animCallback);
      }
    });
  }, [openAnimValue, track, readOnlyModeEnabled]);

  const closeModal = useCallback(() => {
    const animCallback = () => {
      setIsOpened(false);
    };
    openAnimValue.value = withTiming(2, animParams, finished => {
      if (finished) {
        openAnimValue.value = 0;
        scheduleOnRN(animCallback);
      }
    });
  }, [openAnimValue]);

  const { screen } = useContext(AnalyticsContext);

  const onPressButton = useCallback(() => {
    if (getIsModalOpened()) {
      closeModal();
      track("button_clicked", {
        button: "close_trade",
        drawer: "trade",
        screen,
      });
    } else {
      openModal();
      track("button_clicked", {
        button: "trade",
        drawer: "trade",
        screen,
      });
    }
  }, [getIsModalOpened, closeModal, track, screen, openModal]);

  const handleBackPress = useCallback(() => {
    if (!getIsModalOpened()) return false;
    closeModal();
    return true;
  }, [getIsModalOpened, closeModal]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");
  const { bottom: bottomInset, top: topInset } = useSafeAreaInsets();

  const drawerHeight =
    screenHeight -
    bottomInset -
    topInset -
    (isExperimental || Config.DETOX ? ExperimentalHeaderHeight : 0);

  return (
    <>
      <BackdropPressable animatedProps={backdropProps} onPress={closeModal} style={opacityStyle} />
      {isOpened ? (
        <AnimatedDrawerContainer
          animatedProps={drawerContainerProps}
          style={[
            {
              bottom: -bottomInset,
              width: screenWidth,
              maxHeight: drawerHeight,
              paddingBottom: bottomInset + 16 + MAIN_BUTTON_SIZE + MAIN_BUTTON_BOTTOM,
            },
            Config.DETOX ? {} : opacityStyle,
            Config.DETOX ? {} : translateYStyle,
          ]}
        >
          <TransferDrawer onClose={closeModal} />
        </AnimatedDrawerContainer>
      ) : null}
      <MainButton
        style={({ pressed }: { pressed: boolean }) => (pressed ? { opacity: 1 } : {})}
        disabled={lockSubject.getValue()}
        onPress={onPressButton}
        bottom={MAIN_BUTTON_BOTTOM}
        testID="transfer-button"
      >
        <Lottie
          source={themeType === "light" ? lightAnimSource : darkAnimSource}
          progress={lottieProgress}
          loop={false}
          style={{
            width: MAIN_BUTTON_SIZE,
            height: MAIN_BUTTON_SIZE,
          }}
        />
      </MainButton>
    </>
  );
}
