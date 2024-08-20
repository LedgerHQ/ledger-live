import React, { RefObject, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { Flex } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { ArrowLeftMedium, ArrowRightMedium, ReverseMedium } from "@ledgerhq/native-ui/assets/icons";
import { safeGetRefValue, CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import SelectAccountButton from "./SelectAccountButton";

const BAR_HEIGHT = 60;
export const TOTAL_HEADER_HEIGHT = BAR_HEIGHT;
const ANIMATION_HEIGHT = TOTAL_HEADER_HEIGHT;
const LAYOUT_RANGE = [0, ANIMATION_HEIGHT];

type BottomBarProps = {
  manifest: AppManifest;
  webviewAPIRef: RefObject<WebviewAPI>;
  webviewState: WebviewState;
  currentAccountHistDb: CurrentAccountHistDB;
  layoutY: SharedValue<number>;
};

function IconButton({
  children,
  onPress,
  disabled,
  ...flexProps
}: React.PropsWithChildren<
  {
    children: React.ReactNode;
    disabled?: boolean;
    onPress: () => void;
  } & React.ComponentProps<typeof Flex>
>) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Flex justifyContent="center" alignItems="center" height={40} width={40} {...flexProps}>
        {children}
      </Flex>
    </TouchableOpacity>
  );
}

export function BottomBar({
  manifest,
  webviewAPIRef,
  webviewState,
  currentAccountHistDb,
  layoutY,
}: BottomBarProps) {
  const { colors } = useTheme();
  const shouldDisplaySelectAccount = !!manifest.dapp;

  const handleForward = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goForward();
  }, [webviewAPIRef]);

  const handleBack = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.goBack();
  }, [webviewAPIRef]);

  const handleReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);

    webview.reload();
  }, [webviewAPIRef]);

  const heightStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    const headerHeight = interpolate(
      layoutY.value,
      LAYOUT_RANGE,
      [TOTAL_HEADER_HEIGHT, TOTAL_HEADER_HEIGHT - ANIMATION_HEIGHT],
      Extrapolation.CLAMP,
    );

    return {
      backgroundColor: colors.background,
      height: headerHeight,
    };
  });

  const opacityStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    return {
      height: TOTAL_HEADER_HEIGHT,
      opacity: interpolate(layoutY.value, [0, ANIMATION_HEIGHT], [1, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={heightStyle}>
      <Animated.View style={opacityStyle}>
        <Flex flexDirection="row" height={BAR_HEIGHT} paddingY={4} paddingX={4} alignItems="center">
          <Flex flexDirection="row" flex={1}>
            <IconButton onPress={handleBack} marginRight={4} disabled={!webviewState.canGoBack}>
              <ArrowLeftMedium
                size={24}
                color={webviewState.canGoBack ? colors.darkBlue : colors.grey}
              />
            </IconButton>

            <IconButton onPress={handleForward} disabled={!webviewState.canGoForward}>
              <ArrowRightMedium
                size={24}
                color={webviewState.canGoForward ? colors.darkBlue : colors.grey}
              />
            </IconButton>
          </Flex>

          {shouldDisplaySelectAccount ? (
            <SelectAccountButton manifest={manifest} currentAccountHistDb={currentAccountHistDb} />
          ) : null}

          <IconButton onPress={handleReload} alignSelf="flex-end">
            <ReverseMedium size={24} color="neutral.c100" />
          </IconButton>
        </Flex>
      </Animated.View>
    </Animated.View>
  );
}
