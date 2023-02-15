import React, { useState, useCallback } from "react";
import { StyleSheet, TouchableOpacity, Platform } from "react-native";
import Animated, { Extrapolate } from "react-native-reanimated";
import { Trans } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import Config from "react-native-config";
import { useHasLocallyOverriddenFeatureFlags } from "@ledgerhq/live-common/featureFlags/useHasOverriddenFeatureFlags";
import { Flex } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import { useExperimental } from "../../../experimental";
import { runCollapse } from "../../../components/CollapsibleList";
import LText from "../../../components/LText";
import ExperimentalIcon from "../../../icons/Experimental";
import { rejections } from "../../../logic/debugReject";
import { NavigatorName, ScreenName } from "../../../const";
import { BaseNavigation } from "../../../components/RootNavigator/types/helpers";
import { featureFlagsBannerVisibleSelector } from "../../../reducers/settings";

const { cond, set, Clock, Value, interpolateNode, eq } = Animated;
export const HEIGHT = Platform.OS === "ios" ? 70 : 30;

function ExperimentalHeader({
  isExperimental,
  areFeatureFlagsOverridden,
}: {
  isExperimental: boolean;
  areFeatureFlagsOverridden: boolean;
}) {
  const navigation = useNavigation<BaseNavigation>();
  const { colors } = useTheme();
  const clock = new Clock();
  // animation Open state
  const [openState] = useState(new Value(Config.MOCK ? 1 : 0));
  // animation opening anim node
  const openingAnim = cond(
    // @ts-expect-error Terrible bindings, the type is correct.
    //
    // > If conditionNode evaluates to "truthy" value (…)
    // See: https://docs.swmansion.com/react-native-reanimated/docs/1.x.x/nodes/cond
    !Config.MOCK,
    cond(
      // @ts-expect-error Same thing here…
      eq(isExperimental || areFeatureFlagsOverridden, true),
      [
        // opening
        set(openState, runCollapse(clock, openState, 1)),
        openState,
      ],
      [
        // closing
        set(openState, runCollapse(clock, openState, 0)),
        openState,
      ],
    ),
    openState,
  );
  // interpolated height from opening anim state for list container
  const height = interpolateNode(openingAnim, {
    inputRange: [0, 1],
    outputRange: [0, HEIGHT],
    extrapolate: Extrapolate.CLAMP,
  });
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
          height,
          backgroundColor: colors.lightLiveBg,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: openingAnim,
            backgroundColor: colors.lightLiveBg,
          },
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

export default function ExpHeader() {
  const isExperimental = useExperimental();
  const hasLocallyOverriddenFlags = useHasLocallyOverriddenFeatureFlags();
  const featureFlagsBannerVisible =
    useSelector(featureFlagsBannerVisibleSelector) && hasLocallyOverriddenFlags;
  return isExperimental || featureFlagsBannerVisible ? (
    <ExperimentalHeader
      isExperimental={isExperimental}
      areFeatureFlagsOverridden={featureFlagsBannerVisible}
    />
  ) : null;
}
const styles = StyleSheet.create({
  root: {
    width: "100%",
    position: "relative",
    overflow: "visible",
    zIndex: 1,
  },
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 0 : -30,
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
