import React, { useCallback, useEffect } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Config from "react-native-config";
import { useHasLocallyOverriddenFeatureFlags } from "@ledgerhq/live-common/featureFlags/useHasOverriddenFeatureFlags";
import { Flex } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { useExperimental } from "../../../experimental";
import LText from "~/components/LText";
import ExperimentalIcon from "~/icons/Experimental";
import { rejections } from "~/logic/debugReject";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { featureFlagsBannerVisibleSelector } from "~/reducers/settings";

export const HEIGHT = 30;
export const PADDING = 8;

function ExperimentalHeader() {
  const navigation = useNavigation<BaseNavigation>();
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  const isExperimental = useExperimental();
  const hasLocallyOverriddenFlags = useHasLocallyOverriddenFeatureFlags();
  const areFeatureFlagsOverridden =
    useSelector(featureFlagsBannerVisibleSelector) && hasLocallyOverriddenFlags;

  // Reanimated value representing the state of the header: 0: closed, 1: opened
  const openState = useSharedValue(Config.MOCK ? 1 : 0);

  useEffect(() => {
    if (Config.MOCK) return;
    if (isExperimental || areFeatureFlagsOverridden) {
      openState.value = withTiming(1, { duration: 200 });
    } else {
      openState.value = withTiming(0, { duration: 200 });
    }
  }, [isExperimental, areFeatureFlagsOverridden, openState]);

  const opacityStyle = useAnimatedStyle(
    () => ({
      opacity: openState.value,
    }),
    [openState],
  );

  // Animated style updating the height depending on the opening animation state
  const heightStyle = useAnimatedStyle(
    () => ({
      height: interpolate(
        openState.value,
        [0, 1],
        [0, HEIGHT + top + PADDING],
        Extrapolation.CLAMP,
      ),
    }),
    [openState, top],
  );

  const onPressMock = useCallback(() => {
    rejections.next();
  }, []);

  const onPressExperimental: () => void = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: {
        screen: ScreenName.ExperimentalSettings,
      },
    });
  }, [navigation]);

  const onPressFlags: () => void = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: {
        screen: ScreenName.DebugFeatureFlags,
      },
    });
  }, [navigation]);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: colors.lightLiveBg,
        },
        heightStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            top,
            backgroundColor: colors.lightLiveBg,
          },
          opacityStyle,
        ]}
      >
        {isExperimental && (
          <>
            <ExperimentalIcon size={16} color={colors.live} />
            <LText bold style={styles.label} onPress={onPressExperimental} py={4}>
              <Trans i18nKey="settings.experimental.title" />
            </LText>
          </>
        )}

        {areFeatureFlagsOverridden ? (
          <Flex px={4}>
            <LText bold style={styles.label} onPress={onPressFlags}>
              <Trans i18nKey="settings.debug.bannerTitle" />
            </LText>
          </Flex>
        ) : null}

        {Config.MOCK ? (
          <TouchableOpacity onPress={onPressMock}>
            <LText bold style={styles.label}>
              MOCK
            </LText>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

export default ExperimentalHeader;

const styles = StyleSheet.create({
  root: {
    overflow: "visible",
  },
  container: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginLeft: 8,
    fontSize: 12,
  },
});
