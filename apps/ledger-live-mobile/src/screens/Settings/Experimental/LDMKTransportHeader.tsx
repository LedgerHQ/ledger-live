import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Config from "react-native-config";

import LText from "~/components/LText";

import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";

import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

export const HEIGHT = 30;

function LDMKTransportHeader() {
  const navigation = useNavigation<BaseNavigation>();
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();

  const { t } = useTranslation();

  const ldmkTransportFlag = useFeature("ldmkTransport");

  const isLDMKEnabled = !!ldmkTransportFlag?.enabled && ldmkTransportFlag?.params?.warningVisible;

  // Reanimated value representing the state of the header: 0: closed, 1: opened
  const openState = useSharedValue(Config.MOCK ? 1 : 0);

  // Reacts to a change on isExperimental and areFeatureFlagsOverridden
  useAnimatedReaction(
    () => {
      return isLDMKEnabled;
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
    height: interpolate(openState.value, [0, 1], [0, HEIGHT + top], Extrapolation.CLAMP),
  }));

  const onPressFeatureFlag: () => void = useCallback(() => {
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
          zIndex: isLDMKEnabled ? 1 : 0,
          marginBottom: isLDMKEnabled ? 0 : -top + 20,
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
        {isLDMKEnabled && (
          <>
            <LText bold style={styles.label} onPress={onPressFeatureFlag}>
              {t("common.ldmkEnabled")}
            </LText>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

export default LDMKTransportHeader;

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
