import React, { useCallback, useRef } from "react";
import { IconsLegacy, Alert as AlertBox, Flex } from "@ledgerhq/native-ui";
import { Alert, TouchableWithoutFeedback, View } from "react-native";
import { useFeatureFlags } from "@ledgerhq/live-config/featureFlags/FeatureFlagsContext";
import { groupedFeatures } from "@ledgerhq/live-config/featureFlags/groupedFeatures";
import { TrackScreen } from "~/analytics";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import PoweredByLedger from "../PoweredByLedger";

export default function DebugSettings({
  navigation: { navigate },
}: StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DebugSettings>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressCount = useRef(0);

  const { getFeature, overrideFeature } = useFeatureFlags();

  const ruleThemAll = useCallback(() => {
    groupedFeatures.stax.featureIds.forEach(featureId =>
      overrideFeature(featureId, { ...getFeature(featureId), enabled: true }),
    );
    Alert.alert("I can only show you the door, you're the one that has to walk through it.");
  }, [overrideFeature, getFeature]);

  const onDebugHiddenPress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    pressCount.current += 1;
    const timeout = setTimeout(() => {
      pressCount.current = 0;
    }, 300);
    if (pressCount.current > 6) {
      ruleThemAll();
      pressCount.current = 0;
    }
    timeoutRef.current = timeout;
    return () => {
      clearTimeout(timeout);
    };
  }, [ruleThemAll]);

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Debug" />
      <Flex p={6} pt={0}>
        <AlertBox type={"warning"} title={"Tools for development, debugging and QA."} />
      </Flex>
      <SettingsRow
        hasBorderTop
        title="Configuration"
        desc="Env variables, feature-flags, and toggles."
        iconLeft={<IconsLegacy.SettingsMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugConfiguration)}
      />
      <SettingsRow
        title="Features & flows"
        desc="Specific flows and tools"
        iconLeft={<IconsLegacy.BoxMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugFeatures)}
      />
      <SettingsRow
        title="Connectivity"
        desc="Transports, proxy, benchmarking, repl"
        iconLeft={<IconsLegacy.NanoXAltMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugConnectivity)}
      />
      <SettingsRow
        title="Generators and Destructors"
        desc="Create new accounts, announcements, etc"
        iconLeft={<IconsLegacy.MicrochipMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugGenerators)}
      />
      <SettingsRow
        title="Debugging"
        desc="Logs, application state, errors"
        iconLeft={<IconsLegacy.LogsMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugDebugging)}
      />
      <SettingsRow
        title="Information"
        desc="Get information on your current setup"
        iconLeft={<IconsLegacy.InfoAltMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugInformation)}
      />
      <SettingsRow
        title="Performance"
        desc="Get performance information about your setup"
        iconLeft={<IconsLegacy.BarChartMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugPerformance)}
      />
      <SettingsRow
        title="Playground"
        desc="Easy to access blank debugging screen"
        iconLeft={<IconsLegacy.EmojiHappyMedium size={24} color="black" />}
        onPress={() => navigate(ScreenName.DebugPlayground)}
      />
      <TouchableWithoutFeedback onPress={onDebugHiddenPress}>
        <View>
          <PoweredByLedger />
        </View>
      </TouchableWithoutFeedback>
    </SettingsNavigationScrollView>
  );
}
