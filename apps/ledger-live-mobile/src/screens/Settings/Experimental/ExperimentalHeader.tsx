import React, { useCallback, useEffect, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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

const ANIMATION_DURATION = 200;
const ANIMATION_CONFIG = { duration: ANIMATION_DURATION };
const CLOSED_STATE = 0;
const OPENED_STATE = 1;

function ExperimentalHeader() {
  const navigation = useNavigation<BaseNavigation>();
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  const isExperimental = useExperimental();
  const hasLocallyOverriddenFlags = useHasLocallyOverriddenFeatureFlags();
  const featureFlagsBannerVisible = useSelector(featureFlagsBannerVisibleSelector);
  const isMock = !!Config.MOCK;

  const areFeatureFlagsOverridden = useMemo(
    () => featureFlagsBannerVisible && hasLocallyOverriddenFlags,
    [featureFlagsBannerVisible, hasLocallyOverriddenFlags],
  );

  const shouldShowHeader = useMemo(
    () => isExperimental || areFeatureFlagsOverridden,
    [isExperimental, areFeatureFlagsOverridden],
  );

  const openState = useSharedValue(isMock ? OPENED_STATE : CLOSED_STATE);

  useEffect(() => {
    if (isMock) return;

    const targetState = shouldShowHeader ? OPENED_STATE : CLOSED_STATE;
    openState.value = withTiming(targetState, ANIMATION_CONFIG);
  }, [shouldShowHeader, openState]);

  const opacityStyle = useAnimatedStyle(
    () => ({
      opacity: openState.value,
    }),
    [openState],
  );

  const heightStyle = useAnimatedStyle(
    () => ({
      height: interpolate(
        openState.value,
        [CLOSED_STATE, OPENED_STATE],
        [0, HEIGHT + PADDING + top],
        Extrapolation.CLAMP,
      ),
    }),
    [openState, top],
  );

  const onPressMock = useCallback(() => {
    rejections.next();
  }, []);

  const onPressExperimental = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: {
        screen: ScreenName.ExperimentalSettings,
      },
    });
  }, [navigation]);

  const onPressFlags = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Settings,
      params: {
        screen: ScreenName.DebugFeatureFlags,
      },
    });
  }, [navigation]);

  const containerHeight = useMemo(() => HEIGHT + PADDING + top, [top]);

  const rootStyle = useMemo(
    () => [
      styles.root,
      {
        backgroundColor: colors.lightLiveBg,
      },
    ],
    [colors.lightLiveBg],
  );

  const containerBaseStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: colors.lightLiveBg,
      },
    ],
    [colors.lightLiveBg],
  );

  if (isMock) {
    return (
      <View
        style={[
          rootStyle,
          {
            height: containerHeight,
          },
        ]}
      >
        <View style={[containerBaseStyle, { top }]}>
          <TouchableOpacity onPress={onPressMock}>
            <LText bold style={styles.label}>
              MOCK
            </LText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[rootStyle, heightStyle]}>
      <Animated.View
        style={[
          containerBaseStyle,
          {
            top,
          },
          opacityStyle,
        ]}
      >
        {isExperimental && (
          <>
            <ExperimentalIcon size={16} color={colors.live} />
            <TouchableOpacity onPress={onPressExperimental}>
              <LText bold style={styles.label} py={4}>
                <Trans i18nKey="settings.experimental.title" />
              </LText>
            </TouchableOpacity>
          </>
        )}

        {areFeatureFlagsOverridden && (
          <Flex px={4}>
            <TouchableOpacity onPress={onPressFlags}>
              <LText bold style={styles.label}>
                <Trans i18nKey="settings.debug.bannerTitle" />
              </LText>
            </TouchableOpacity>
          </Flex>
        )}
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
