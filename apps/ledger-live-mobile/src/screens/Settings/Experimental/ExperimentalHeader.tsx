import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Config from "react-native-config";
import { useHasLocallyOverriddenFeatureFlags } from "@ledgerhq/live-config/featureFlags/useHasOverriddenFeatureFlags";
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

  // Reacts to a change on isExperimental and areFeatureFlagsOverridden
  useAnimatedReaction(
    () => {
      return isExperimental || areFeatureFlagsOverridden;
    },
    checkResult => {
      // If mocking the app, does not react to a change
      if (Config.MOCK) return;

      if (checkResult) {
        // Opening the experimental header: 0 -> 1
        openState.value = withTiming(1, {
          duration: 200,
        });
      } else {
        // Closing the experimental header: 1 -> 0
        openState.value = withTiming(0, {
          duration: 200,
        });
      }
    },
  );

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: openState.value,
  }));

  // Animated style updating the height depending on the opening animation state
  const heightStyle = useAnimatedStyle(() => ({
    height: interpolate(openState.value, [0, 1], [0, HEIGHT + top], Extrapolate.CLAMP),
  }));

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
          zIndex: !isExperimental && !areFeatureFlagsOverridden && !Config.MOCK ? 0 : 1,
          marginBottom: isExperimental || Config.MOCK ? -top + 20 : 0,
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
            <LText bold style={styles.label} onPress={onPressExperimental}>
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
    width: "100%",
    position: "relative",
    overflow: "visible",
  },
  container: {
    position: "absolute",
    left: 0,
    width: "100%",
    height: 38,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginLeft: 8,
    fontSize: 12,
  },
});
